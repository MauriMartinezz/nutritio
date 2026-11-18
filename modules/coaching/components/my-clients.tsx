import Link from "next/link";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/modules/identity/dal";
import { meetingKindLabel } from "@/modules/meetings/rules";
import { badge, buttonPrimary, buttonSecondary, callout, card, figure, link, muted, type Tone } from "@/modules/ui/classes";
import { effectiveAccessUntil } from "../access";
import {
  ROSTER_FILTERS,
  matchesFilter,
  parseRosterDialog,
  parseRosterFilter,
  rosterHref,
  rosterStatus,
  sortRoster,
  type RosterStatus,
} from "../roster";
import { RosterDialogs } from "./roster-dialogs";

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
  "flex items-center justify-between gap-3 before:text-xs before:font-medium before:text-secondary before:content-[attr(data-label)] md:table-cell md:px-3 md:py-3 md:align-middle md:whitespace-nowrap md:before:content-none md:first:pl-0 md:last:pr-0";
const timeFormat: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/**
 * A nutritionist's clients in one table, one line per client. Renewing,
 * accepting and answering meetings open a dialog. Render inside <Suspense>.
 */
export async function MyClients({ searchParams }: { searchParams: SearchParams }) {
  const nutritionist = await requireRole("NUTRITIONIST");
  const params = await searchParams;
  const filter = parseRosterFilter(params.filter);
  const dialog = parseRosterDialog(params);

  if (nutritionist.nutritionistStatus !== "APPROVED") {
    return <p className={callout("warning")}>Clients can find you once an admin verifies your profile.</p>;
  }

  await connection();
  const now = new Date();
  const [links, meetings] = await Promise.all([
    prisma.nutritionistClient.findMany({
      where: { nutritionistId: nutritionist.id },
      select: {
        id: true,
        status: true,
        accessAmount: true,
        accessUnit: true,
        accessUntil: true,
        autoRenew: true,
        client: { select: { id: true, name: true } },
      },
      orderBy: { requestedAt: "asc" },
    }),
    // Pending requests (oldest first) and upcoming meetings (soonest first).
    prisma.meetingRequest.findMany({
      where: {
        link: { nutritionistId: nutritionist.id },
        OR: [{ status: "PENDING" }, { status: "ACCEPTED", scheduledFor: { gte: now } }],
      },
      select: { id: true, linkId: true, kind: true, status: true, scheduledFor: true },
      orderBy: [{ scheduledFor: "asc" }, { createdAt: "asc" }],
    }),
  ]);

  const rows = sortRoster(
    links.map((row) => {
      const access = { ...row, amount: row.accessAmount, unit: row.accessUnit };
      const pending = meetings.filter((m) => m.linkId === row.id && m.status === "PENDING");
      const next = meetings.find((m) => m.linkId === row.id && m.status === "ACCEPTED");
      const reasons = [
        ...(row.status === "PENDING" ? ["request to work with you"] : []),
        ...(pending.length > 0 ? [`${pending.length} meeting request${pending.length === 1 ? "" : "s"}`] : []),
      ];
      return {
        id: row.id,
        linkStatus: row.status,
        client: row.client,
        access,
        period: { amount: row.accessAmount, unit: row.accessUnit },
        status: rosterStatus(access, now),
        until: row.status === "ACCEPTED" ? effectiveAccessUntil(access, now) : null,
        pendingMeeting: pending[0] ?? null,
        nextMeeting: next ?? null,
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
              href={rosterHref(option.value)}
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
                {["Client", "Status", "Access until", "Meetings"].map((heading) => (
                  <th key={heading} scope="col" className="px-3 pb-3 font-medium first:pl-0">
                    {heading}
                  </th>
                ))}
                <th scope="col" className="pb-3 pl-3 text-right font-medium">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="block divide-y divide-divider md:table-row-group">
              {visible.map((row) => {
                const pill = STATUS_PILLS[row.status];
                const accepted = row.linkStatus === "ACCEPTED";
                return (
                  <tr key={row.id} className="flex flex-col gap-2 py-4 first:pt-0 last:pb-0 md:table-row">
                    <th scope="row" className="text-left font-normal md:table-cell md:py-3 md:pr-3">
                      <span className="flex items-center gap-2">
                        {accepted ? (
                          <Link href={`/clients/${row.client.id}`} className={`${link} truncate font-semibold`}>
                            {row.client.name}
                          </Link>
                        ) : (
                          <span className="truncate font-semibold">{row.client.name}</span>
                        )}
                        {row.needsAction && <ActionBell reasons={row.reasons} />}
                      </span>
                    </th>
                    <td data-label="Status" className={cell}>
                      <span className={badge(pill.tone)}>{pill.label}</span>
                    </td>
                    <td data-label="Access until" className={cell}>
                      <span className={row.until ? figure : "text-tertiary"}>
                        {row.until?.toLocaleDateString() ?? "—"}
                      </span>
                    </td>
                    <td data-label="Meetings" className={cell}>
                      {row.pendingMeeting ? (
                        <span className={badge("warning")}>{meetingKindLabel(row.pendingMeeting.kind)} requested</span>
                      ) : row.nextMeeting?.scheduledFor ? (
                        <span className="font-mono text-xs tabular-nums">
                          {row.nextMeeting.scheduledFor.toLocaleString("en-US", timeFormat)}
                        </span>
                      ) : (
                        <span className="text-tertiary">—</span>
                      )}
                    </td>
                    <td className="flex flex-wrap justify-end gap-2 pt-1 md:table-cell md:py-3 md:pl-3 md:text-right">
                      <span className="inline-flex flex-wrap justify-end gap-2">
                        {row.linkStatus === "PENDING" && (
                          <Link
                            href={rosterHref(filter, { accept: row.id })}
                            scroll={false}
                            className={buttonPrimary}
                          >
                            Review request
                          </Link>
                        )}
                        {row.pendingMeeting && (
                          <Link
                            href={rosterHref(filter, { meeting: row.pendingMeeting.id })}
                            scroll={false}
                            className={buttonPrimary}
                          >
                            Answer
                          </Link>
                        )}
                        {accepted && (
                          <Link
                            href={rosterHref(filter, { renew: row.id })}
                            scroll={false}
                            className={buttonSecondary}
                          >
                            Renew
                          </Link>
                        )}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>

      <RosterDialogs dialog={dialog} rows={rows} filter={filter} nutritionistId={nutritionist.id} now={now} />
    </div>
  );
}
