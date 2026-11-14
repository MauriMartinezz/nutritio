// The nutritionist's client table: row status, time left, quick renew presets,
// filters and ordering.

import { AccessRuleError, accessState, parsePeriod, type AccessPeriod, type LinkAccess, type AccessState } from "./access";
import type { LinkStatus } from "./links";

export type RosterStatus = AccessState | "PENDING" | "REJECTED";

export function rosterStatus(link: { status: LinkStatus } & LinkAccess, now: Date): RosterStatus {
  if (link.status === "PENDING") return "PENDING";
  if (link.status === "REJECTED") return "REJECTED";
  return accessState(link, now);
}

const DAY_MS = 24 * 60 * 60 * 1000;
const plural = (amount: number, unit: string) => `${amount} ${unit}${amount === 1 ? "" : "s"}`;

/** "12 days left", "3 weeks left", "3 months left", or "Ended 4 days ago" once expired. */
export function timeLeftLabel(until: Date | null, now: Date): string {
  if (!until) return "—";
  const days = (until.getTime() - now.getTime()) / DAY_MS;
  if (days <= 0) {
    const ago = Math.floor(-days);
    return ago === 0 ? "Ended today" : `Ended ${plural(ago, "day")} ago`;
  }
  if (days < 1) return "Less than a day left";
  if (days < 14) return `${plural(Math.floor(days), "day")} left`;
  if (days < 56) return `${plural(Math.floor(days / 7), "week")} left`;
  return `${plural(Math.floor(days / 30), "month")} left`;
}

export const PERIOD_PRESETS = [
  { value: "1M", label: "1 month", period: { amount: 1, unit: "MONTH" } },
  { value: "3M", label: "3 months", period: { amount: 3, unit: "MONTH" } },
  { value: "6M", label: "6 months", period: { amount: 6, unit: "MONTH" } },
  { value: "1Y", label: "1 year", period: { amount: 12, unit: "MONTH" } },
] as const satisfies readonly { value: string; label: string; period: AccessPeriod }[];

export const CUSTOM_PRESET = "custom";

/**
 * Period from a renew/accept form: a quick preset, or amount + unit when the
 * preset is "custom" or absent (forms without the quick select).
 */
export function parsePeriodChoice(fields: { preset?: unknown; amount?: unknown; unit?: unknown }): AccessPeriod {
  const { preset } = fields;
  if (preset === undefined || preset === null || preset === "" || preset === CUSTOM_PRESET) {
    return parsePeriod(fields.amount, fields.unit);
  }
  const match = PERIOD_PRESETS.find((option) => option.value === preset);
  if (!match) throw new AccessRuleError("Choose a renewal period");
  return { ...match.period };
}

export const ROSTER_FILTERS = [
  { value: "all", label: "All" },
  { value: "needs-action", label: "Needs action" },
  { value: "active", label: "Active" },
  { value: "expiring", label: "Expiring" },
  { value: "expired", label: "Expired" },
  { value: "pending", label: "Pending" },
  { value: "rejected", label: "Rejected" },
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
