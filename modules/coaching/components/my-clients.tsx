import Link from "next/link";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/modules/identity/dal";
import { MeetingRequestsSection } from "@/modules/meetings/components/meeting-requests-section";
import { badge, buttonSecondary, callout, card, figure, link, muted, type Tone } from "@/modules/ui/classes";
import { DEFAULT_PERIOD, effectiveAccessUntil } from "../access";
import { acceptClientRequest, rejectClientRequest, renewClientAccess } from "../actions";
import {
  ROSTER_FILTERS,
  matchesFilter,
  parseRosterFilter,
  rosterStatus,
  sortRoster,
  timeLeftLabel,
  type RosterStatus,
} from "../roster";
import { formatPeriod } from "./period-fields";
import { QuickPeriodForm } from "./quick-period-form";

export const STATUS_PILLS: Record<RosterStatus, { label: string; tone: Tone }> = {
  ACTIVE: { label: "Active", tone: "success" },
  EXPIRING: { label: "Expiring", tone: "warning" },
  EXPIRED: { label: "Expired", tone: "danger" },
  PENDING: { label: "Pending", tone: "neutral" },
  REJECTED: { label: "Rejected", tone: "danger" },
};

/** Bell shown on rows that need the nutritionist's action. */
function ActionBell({ reasons }: { reasons: string[] }) {
  const text = `Needs action: ${reasons.join(", ")}`;
  return (
    <span role="img" aria-label={text} title={text} className="inline-flex shrink-0 text-warning">
      <svg viewBox="0 0 24 24" fill="currentColor" className="size-5" aria-hidden="true">
        <path d="M12 2a6 6 0 0 0-6 6v3.6l-1.7 3.4A1 1 0 0 0 5.2 16.5h13.6a1 1 0 0 0 .9-1.5L18 11.6V8a6 6 0 0 0-6-6Zm0 20a3 3 0 0 0 2.8-2H9.2A3 3 0 0 0 12 22Z" />
      </svg>
    </span>
  );
}

const cell =
  "flex items-center justify-between gap-3 before:text-xs before:font-medium before:text-secondary before:content-[attr(data-label)] md:table-cell md:px-3 md:py-3 md:align-middle md:before:content-none md:first:pl-0 md:last:pr-0";

/** A nutritionist's clients in one table. Render inside <Suspense>. */
export async function MyClients({ searchParams }: { searchParams: Promise<{ filter?: string | string[] }> }) {
  const nutritionist = await requireRole("NUTRITIONIST");
  const filter = parseRosterFilter((await searchParams).filter);

  if (nutritionist.nutritionistStatus !== "APPROVED") {
    return <p className={callout("warning")}>Clients can find you once an admin verifies your profile.</p>;
  }

  const [links, meetingCounts] = await Promise.all([
    prisma.nutritionistClient.findMany({
      where: { nutritionistId: nutritionist.id },
      select: {
        id: true,
        status: true,
        accessAmount: true,
        accessUnit: true,
        accessUntil: true,
        autoRenew: true,
        client: { select: { id: true, name: true, email: true } },
      },
      orderBy: { requestedAt: "asc" },
    }),
    prisma.meetingRequest.groupBy({
      by: ["linkId"],
      where: { status: "PENDING", link: { nutritionistId: nutritionist.id } },
      _count: { _all: true },
    }),
  ]);
  await connection();
  const now = new Date();
  const pendingMeetings = new Map(meetingCounts.map((row) => [row.linkId, row._count._all]));

  const rows = sortRoster(
    links.map((link) => {
      const access = { ...link, amount: link.accessAmount, unit: link.accessUnit };
      const meetings = pendingMeetings.get(link.id) ?? 0;
      const reasons = [
        ...(link.status === "PENDING" ? ["request to work with you"] : []),
        ...(meetings > 0 ? [`${meetings} meeting request${meetings === 1 ? "" : "s"}`] : []),
      ];
      const status = rosterStatus(access, now);
      return {
        ...link,
        period: { amount: link.accessAmount, unit: link.accessUnit },
        status,
        until: link.status === "ACCEPTED" ? effectiveAccessUntil(access, now) : null,
        needsAction: reasons.length > 0,
        reasons,
      };
    }),
  );
  const visible = rows.filter((row) => matchesFilter(row, filter));

  return (
    <div className="flex flex-col gap-6">
      <nav aria-label="Filter clients" className="flex gap-2 overflow-x-auto">
        {ROSTER_FILTERS.map((option) => {
          const count = rows.filter((row) => matchesFilter(row, option.value)).length;
          const active = option.value === filter;
          return (
            <Link
              key={option.value}
              href={option.value === "all" ? "/clients" : `/clients?filter=${option.value}`}
              aria-current={active ? "page" : undefined}
              className={`inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border px-4 text-sm font-medium ${
                active ? "border-ink bg-ink text-bg" : "border-line-strong bg-surface text-secondary hover:text-ink"
              }`}
            >
              {option.label} <span className="font-mono">· {count}</span>
            </Link>
          );
        })}
      </nav>

      <section className={card} aria-label="Clients">
        {rows.length === 0 ? (
          <p className={muted}>You have no clients yet. Clients find you in the directory.</p>
        ) : visible.length === 0 ? (
          <p className={muted}>No clients match this filter.</p>
        ) : (
          <table className="block w-full text-sm md:table">
            <thead className="hidden border-b border-line text-left text-xs text-secondary md:table-header-group">
              <tr>
                {["Client", "Status", "Time left", "Access until", "Auto-renew", "Actions"].map((heading) => (
                  <th key={heading} scope="col" className="px-3 pb-3 font-medium first:pl-0 last:pr-0">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="block divide-y divide-divider md:table-row-group">
              {visible.map((row) => {
                const pill = STATUS_PILLS[row.status];
                const accepted = row.status !== "PENDING" && row.status !== "REJECTED";
                return (
                  <tr key={row.id} className="flex flex-col gap-2 py-4 first:pt-0 last:pb-0 md:table-row">
                    <th scope="row" className="flex items-center gap-2 text-left font-normal md:table-cell md:py-3 md:pr-3">
                      <span className="flex items-center gap-2">
                        {accepted ? (
                          <Link href={`/clients/${row.client.id}`} className={`${link} font-semibold`}>
                            {row.client.name}
                          </Link>
                        ) : (
                          <span className="font-semibold">{row.client.name}</span>
                        )}
                        {row.needsAction && <ActionBell reasons={row.reasons} />}
                      </span>
                      <span className={`${muted} block break-all text-xs max-md:hidden`}>{row.client.email}</span>
                    </th>
                    <td data-label="Status" className={cell}>
                      <span className={badge(pill.tone)}>{pill.label}</span>
                    </td>
                    <td data-label="Time left" className={cell}>
                      <span className={accepted ? "font-medium" : "text-tertiary"}>
                        {accepted ? timeLeftLabel(row.until, now) : "—"}
                      </span>
                    </td>
                    <td data-label="Access until" className={cell}>
                      <span className={row.until ? figure : "text-tertiary"}>
                        {row.until?.toLocaleDateString() ?? "—"}
                      </span>
                    </td>
                    <td data-label="Auto-renew" className={cell}>
                      <span className={row.autoRenew && accepted ? "" : "text-tertiary"}>
                        {accepted && row.autoRenew ? `Every ${formatPeriod(row.period)}` : accepted ? "Off" : "—"}
                      </span>
                    </td>
                    <td className="flex flex-wrap items-center gap-2 pt-1 md:table-cell md:py-3 md:pl-3">
                      {row.status === "PENDING" ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <QuickPeriodForm
                            action={acceptClientRequest.bind(null, row.id)}
                            placeholder="Accept for…"
                            submitLabel="Accept"
                            label={`Accept ${row.client.name} for`}
                            customDefault={DEFAULT_PERIOD}
                          />
                          <form action={rejectClientRequest.bind(null, row.id)}>
                            <button className={buttonSecondary}>Decline</button>
                          </form>
                        </div>
                      ) : accepted ? (
                        <QuickPeriodForm
                          action={renewClientAccess.bind(null, row.id)}
                          placeholder="Renew…"
                          submitLabel="Renew"
                          label={`Renew ${row.client.name} for`}
                          customDefault={row.period}
                        />
                      ) : (
                        <span className="text-tertiary">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>

      <MeetingRequestsSection />
    </div>
  );
}
