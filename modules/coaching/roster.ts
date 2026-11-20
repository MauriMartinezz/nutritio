// The nutritionist's client table: row status, time left, quick renew presets,
// filters and ordering.

import { AccessRuleError, accessState, parsePeriod, type AccessPeriod, type LinkAccess, type AccessState } from "./access";
import type { Locale } from "@/lib/i18n/negotiate";
import type { LinkStatus } from "./links";
import { coachingErrors, coachingLabels } from "./messages";

export type RosterStatus = AccessState | "PENDING" | "REJECTED";

export function rosterStatus(link: { status: LinkStatus } & LinkAccess, now: Date): RosterStatus {
  if (link.status === "PENDING") return "PENDING";
  if (link.status === "REJECTED") return "REJECTED";
  return accessState(link, now);
}

const DAY_MS = 24 * 60 * 60 * 1000;
/** "12 days left", "3 weeks left", "3 months left", or "Ended 4 days ago" once expired. */
export function timeLeftLabel(until: Date | null, now: Date, locale: Locale = "en"): string {
  if (!until) return "—";
  const t = coachingLabels[locale];
  const days = (until.getTime() - now.getTime()) / DAY_MS;
  if (days <= 0) {
    const ago = Math.floor(-days);
    return ago === 0 ? t.endedToday : t.endedDaysAgo(ago);
  }
  if (days < 1) return t.lessThanADay;
  if (days < 14) return t.daysLeft(Math.floor(days));
  if (days < 56) return t.weeksLeft(Math.floor(days / 7));
  return t.monthsLeft(Math.floor(days / 30));
}

export const PERIOD_PRESETS = [
  { value: "1M", period: { amount: 1, unit: "MONTH" } },
  { value: "3M", period: { amount: 3, unit: "MONTH" } },
  { value: "6M", period: { amount: 6, unit: "MONTH" } },
  { value: "1Y", period: { amount: 12, unit: "MONTH" } },
] as const satisfies readonly { value: string; period: AccessPeriod }[];

export const CUSTOM_PRESET = "custom";

/**
 * Period from a renew/accept form: a quick preset, or amount + unit when the
 * preset is "custom" or absent (forms without the quick select).
 */
export function parsePeriodChoice(
  fields: { preset?: unknown; amount?: unknown; unit?: unknown },
  locale: Locale = "en",
): AccessPeriod {
  const { preset } = fields;
  if (preset === undefined || preset === null || preset === "" || preset === CUSTOM_PRESET) {
    return parsePeriod(fields.amount, fields.unit, locale);
  }
  const match = PERIOD_PRESETS.find((option) => option.value === preset);
  if (!match) throw new AccessRuleError(coachingErrors[locale].preset);
  return { ...match.period };
}

export type AutoRenewChoice = { autoRenew: false } | { autoRenew: true; period: AccessPeriod };

/** Auto-renew form: the period only matters (and is only checked) while auto-renew is on. */
export function parseAutoRenew(
  fields: { autoRenew?: unknown; amount?: unknown; unit?: unknown },
  locale: Locale = "en",
): AutoRenewChoice {
  if (fields.autoRenew !== "on") return { autoRenew: false };
  return { autoRenew: true, period: parsePeriod(fields.amount, fields.unit, locale) };
}

export const ROSTER_FILTERS = [
  { value: "all" },
  { value: "needs-action" },
  { value: "active" },
  { value: "expiring" },
  { value: "expired" },
  { value: "pending" },
  { value: "rejected" },
] as const;

export type RosterFilter = (typeof ROSTER_FILTERS)[number]["value"];

export function parseRosterFilter(raw: unknown): RosterFilter {
  return ROSTER_FILTERS.find((filter) => filter.value === raw)?.value ?? "all";
}

export type RosterRow = { status: RosterStatus; needsAction: boolean; until: Date | null };

export function matchesFilter(row: RosterRow, filter: RosterFilter): boolean {
  if (filter === "all") return true;
  if (filter === "needs-action") return row.needsAction;
  return row.status === filter.toUpperCase();
}

const STATUS_ORDER: Record<RosterStatus, number> = { PENDING: 0, EXPIRING: 1, EXPIRED: 2, ACTIVE: 3, REJECTED: 4 };

/** Rows needing action first, then by status, then by the nearest end date. */
export function sortRoster<T extends RosterRow>(rows: T[]): T[] {
  const end = (row: T) => row.until?.getTime() ?? Number.POSITIVE_INFINITY;
  return [...rows].sort(
    (a, b) =>
      Number(b.needsAction) - Number(a.needsAction) ||
      STATUS_ORDER[a.status] - STATUS_ORDER[b.status] ||
      end(a) - end(b),
  );
}

/** Dialogs of the clients table, opened through the URL so they work without JavaScript. */
export const ROSTER_DIALOGS = ["renew", "accept", "meeting"] as const;
export type RosterDialogKind = (typeof ROSTER_DIALOGS)[number];
export type RosterDialog = { kind: RosterDialogKind; id: string };

const first = (value: unknown) => (Array.isArray(value) ? value[0] : value);

/** The dialog named in the search params, e.g. ?renew=<linkId>; null when none. */
export function parseRosterDialog(params: Partial<Record<string, string | string[] | undefined>>): RosterDialog | null {
  for (const kind of ROSTER_DIALOGS) {
    const id = first(params[kind]);
    if (typeof id === "string" && id !== "") return { kind, id };
  }
  return null;
}

/** Link to the clients table with a filter and, optionally, one open dialog. */
export function rosterHref(filter: RosterFilter, dialog?: Partial<Record<RosterDialogKind, string>>): string {
  const params = new URLSearchParams();
  if (filter !== "all") params.set("filter", filter);
  for (const [kind, id] of Object.entries(dialog ?? {})) if (id) params.set(kind, id);
  const query = params.toString();
  return query ? `/clients?${query}` : "/clients";
}

/**
 * Where a renewal returns: the client's own page when renewed from there, else
 * the clients table with its filter. Built from known values only, never a URL from the browser.
 */
export function renewReturnHref(fields: { returnTo?: unknown; filter?: unknown }, clientId: string): string {
  if (fields.returnTo === "client") return `/clients/${encodeURIComponent(clientId)}`;
  return rosterHref(parseRosterFilter(fields.filter));
}
