// Pure helpers for the client home: how much access is left with a nutritionist.
import type { Locale } from "@/lib/i18n/negotiate";
import { dashboardLabels } from "./messages";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Whole days left until the access end, rounded up; 0 when expired or never granted. */
export function accessDaysLeft(until: Date | null, now: Date): number {
  if (!until || until <= now) return 0;
  return Math.ceil((until.getTime() - now.getTime()) / DAY_MS);
}

export type AccessSummary = { expired: boolean; daysLeft: number };

/** "12 days of access left" or "Access expired — ask Ana to renew". */
export function describeAccess(access: AccessSummary, nutritionistName: string, locale: Locale = "en"): string {
  const t = dashboardLabels[locale];
  if (access.expired) return t.accessExpired(nutritionistName);
  return t.accessDaysLeft(access.daysLeft);
}
