import Link from "next/link";
import { connection } from "next/server";
import { formatDateTime } from "@/lib/i18n/format";
import { formatDate } from "../dates";
import { getLocale } from "@/lib/i18n/server";
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
import { coachingLabels, coachingMessages } from "../messages";
import { RosterDialogs } from "./roster-dialogs";

export const STATUS_TONES: Record<RosterStatus, Tone> = {
  ACTIVE: "success",
  EXPIRING: "warning",
  EXPIRED: "danger",
  PENDING: "neutral",
  REJECTED: "danger",
};

/** Bell shown on rows that need the nutritionist's action. */
function ActionBell({ text }: { text: string }) {
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
// Overrides formatDateTime's dateStyle/timeStyle (they can't be combined with field options).
const timeFormat: Intl.DateTimeFormatOptions = {
  dateStyle: undefined,
  timeStyle: undefined,
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
};

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
  const locale = await getLocale();
  const t = coachingMessages[locale];
  const labels = coachingLabels[locale];

  if (nutritionist.nutritionistStatus !== "APPROVED") {
    return <p className={callout("warning")}>{t.notVerified}</p>;
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
        ...(row.status === "PENDING" ? [t.reasonRequest] : []),
        ...(pending.length > 0 ? [t.reasonMeetings(pending.length)] : []),
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
      <nav aria-label={t.filterClients} className="flex gap-2 overflow-x-auto">
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
              {labels.filters[option.value]} <span className="font-mono">· {count}</span>
            </Link>
          );
        })}
      </nav>

      <section className={card} aria-label={t.clients}>
        {rows.length === 0 ? (
          <p className={muted}>{t.noClients}</p>
        ) : visible.length === 0 ? (
          <p className={muted}>{t.noMatches}</p>
        ) : (
          <table className="block w-full text-sm md:table">
            <thead className="hidden border-b border-line text-left text-xs text-secondary md:table-header-group">
              <tr>
                {[t.client, t.status, t.accessUntil, t.meetings].map((heading) => (
                  <th key={heading} scope="col" className="px-3 pb-3 font-medium first:pl-0">
                    {heading}
                  </th>
                ))}
                <th scope="col" className="pb-3 pl-3 text-right font-medium">
                  <span className="sr-only">{t.actions}</span>
                </th>
              </tr>
            </thead>
            <tbody className="block divide-y divide-divider md:table-row-group">
              {visible.map((row) => {
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
                        {row.needsAction && <ActionBell text={t.needsAction(row.reasons.join(", "))} />}
                      </span>
                    </th>
                    <td data-label={t.status} className={cell}>
                      <span className={badge(STATUS_TONES[row.status])}>{labels.statuses[row.status]}</span>
                    </td>
                    <td data-label={t.accessUntil} className={cell}>
                      <span className={row.until ? figure : "text-tertiary"}>
                        {row.until ? formatDate(row.until, locale) : "—"}
                      </span>
                    </td>
                    <td data-label={t.meetings} className={cell}>
                      {row.pendingMeeting ? (
                        <span className={badge("warning")}>{t.meetingRequested(meetingKindLabel(row.pendingMeeting.kind, locale))}</span>
                      ) : row.nextMeeting?.scheduledFor ? (
                        <span className="font-mono text-xs tabular-nums">
                          {formatDateTime(row.nextMeeting.scheduledFor, locale, timeFormat)}
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
                            {t.reviewRequest}
                          </Link>
                        )}
                        {row.pendingMeeting && (
                          <Link
                            href={rosterHref(filter, { meeting: row.pendingMeeting.id })}
                            scroll={false}
                            className={buttonPrimary}
                          >
                            {t.answer}
                          </Link>
                        )}
                        {accepted && (
                          <Link
                            href={rosterHref(filter, { renew: row.id })}
                            scroll={false}
                            className={buttonSecondary}
                          >
                            {t.renew}
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
