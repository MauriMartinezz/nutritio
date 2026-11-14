// Time-limited client access: a nutritionist grants access for a period
// (days, weeks or months) and renews it manually or automatically.

export const ACCESS_UNITS = ["DAY", "WEEK", "MONTH"] as const;
export type AccessUnit = (typeof ACCESS_UNITS)[number];
export type AccessPeriod = { amount: number; unit: AccessUnit };

export const DEFAULT_PERIOD: AccessPeriod = { amount: 1, unit: "MONTH" };
export const EXPIRING_WITHIN_DAYS = 7;
const MAX_AMOUNT = 365;
const DAY_MS = 24 * 60 * 60 * 1000;

export class AccessRuleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AccessRuleError";
  }
}

export function parsePeriod(amount: unknown, unit: unknown): AccessPeriod {
  const raw = typeof amount === "string" ? amount.trim() : typeof amount === "number" ? String(amount) : "";
  if (!/^\d+$/.test(raw) || Number(raw) < 1 || Number(raw) > MAX_AMOUNT) {
    throw new AccessRuleError(`Amount must be a whole number between 1 and ${MAX_AMOUNT}`);
  }
  if (!(ACCESS_UNITS as readonly unknown[]).includes(unit)) {
    throw new AccessRuleError("Unit must be days, weeks or months");
  }
  return { amount: Number(raw), unit: unit as AccessUnit };
}

/** Adds a period. Months are calendar months, clamped to the last day of the month. */
export function addPeriod(from: Date, period: AccessPeriod): Date {
  if (period.unit === "DAY") return new Date(from.getTime() + period.amount * DAY_MS);
  if (period.unit === "WEEK") return new Date(from.getTime() + period.amount * 7 * DAY_MS);

  const result = new Date(from);
  const day = result.getUTCDate();
  result.setUTCDate(1);
  result.setUTCMonth(result.getUTCMonth() + period.amount);
  const lastDay = new Date(Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)).getUTCDate();
  result.setUTCDate(Math.min(day, lastDay));
  return result;
}

export type LinkAccess = { accessUntil: Date | null; autoRenew: boolean } & AccessPeriod;

/**
 * The end date in force. With automatic renewal an expired date rolls forward
 * by the period until it is in the future, so no scheduled job is needed.
 */
export function effectiveAccessUntil(link: LinkAccess, now: Date): Date | null {
  if (!link.accessUntil || !link.autoRenew) return link.accessUntil;
  // Count whole periods from the stored date (not chained), so month ends don't drift.
  let periods = 0;
  let until = link.accessUntil;
  while (until <= now) {
    periods += 1;
    until = addPeriod(link.accessUntil, { amount: link.amount * periods, unit: link.unit });
  }
  return until;
}

export type AccessState = "ACTIVE" | "EXPIRING" | "EXPIRED";

export function accessState(link: LinkAccess, now: Date): AccessState {
  const until = effectiveAccessUntil(link, now);
  if (!until || until <= now) return "EXPIRED";
  return until.getTime() - now.getTime() <= EXPIRING_WITHIN_DAYS * DAY_MS ? "EXPIRING" : "ACTIVE";
}

export const hasActiveAccess = (link: LinkAccess, now: Date) => accessState(link, now) !== "EXPIRED";

/** New end date: extends from the current end while active, or from now once expired. */
export function renewAccess(link: LinkAccess, period: AccessPeriod, now: Date): Date {
  const until = effectiveAccessUntil(link, now);
  const from = until && until > now ? until : now;
  return addPeriod(from, period);
}
