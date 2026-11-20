// Pure helpers for the nutritionist dashboard on the home page.
import { formatDateTime } from "@/lib/i18n/format";
import type { Locale } from "@/lib/i18n/negotiate";
import { dashboardLabels } from "./messages";

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

/** A moment as a short date: the locale's format, or the runtime default when no locale is given. */
export const shortDate = (at: Date, locale?: Locale) =>
  locale
    ? formatDateTime(at, locale, { dateStyle: undefined, timeStyle: undefined, day: "numeric", month: "numeric", year: "numeric" })
    : at.toLocaleDateString();

/** "Just now", "20 min ago", "3 h ago", "Yesterday", "3 days ago", then the date. */
export function relativeTime(at: Date, now: Date, locale?: Locale): string {
  const t = dashboardLabels[locale ?? "en"];
  const elapsed = now.getTime() - at.getTime();
  if (elapsed < MINUTE_MS) return t.justNow;
  if (elapsed < HOUR_MS) return t.minutesAgo(Math.floor(elapsed / MINUTE_MS));
  if (elapsed < DAY_MS) return t.hoursAgo(Math.floor(elapsed / HOUR_MS));
  if (elapsed < 2 * DAY_MS) return t.yesterday;
  if (elapsed < 7 * DAY_MS) return t.daysAgo(Math.floor(elapsed / DAY_MS));
  return shortDate(at, locale);
}

export function startOfMonth(now: Date): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

/** Newest first, at most `limit` events. */
export function latestEvents<T extends { at: Date }>(events: T[], limit: number): T[] {
  return [...events].sort((a, b) => b.at.getTime() - a.at.getTime()).slice(0, limit);
}

type CheckInStatusLike = { state: "NOT_SCHEDULED" | "DUE" | "UPCOMING"; daysLeft: number; due: Date | null };

/** KPI tile text for the client's next check-in; null when there is no active nutritionist. */
export function checkInKpi(status: CheckInStatusLike | null, locale?: Locale): { value: string; hint: string } {
  const t = dashboardLabels[locale ?? "en"];
  if (!status) return { value: "—", hint: t.noNutritionistYet };
  if (status.state === "NOT_SCHEDULED") return { value: "—", hint: t.noScheduleYet };
  if (status.state === "DUE") return { value: t.due, hint: t.sendItToday };
  return {
    value: t.days(status.daysLeft),
    hint: status.due ? t.onDate(shortDate(status.due, locale)) : t.scheduled,
  };
}

/** "Oats 80 g · Yogurt 150 g · Walnuts 15 g + 2 more". */
export function mealSummary(
  items: { food: { label: string }; grams: number }[],
  shown = 3,
  locale: Locale = "en",
): string {
  const t = dashboardLabels[locale];
  if (items.length === 0) return t.noFoodsYet;
  const listed = items.slice(0, shown).map((item) => `${item.food.label} ${item.grams} g`).join(" · ");
  return items.length > shown ? t.andMore(listed, items.length - shown) : listed;
}

/** The soonest accepted meeting that has not started yet, or null. */
export function nextMeeting<T extends { status: string; scheduledFor: Date | null }>(meetings: T[], now: Date): T | null {
  return (
    meetings
      .filter((meeting) => meeting.status === "ACCEPTED" && meeting.scheduledFor && meeting.scheduledFor > now)
      .sort((a, b) => a.scheduledFor!.getTime() - b.scheduledFor!.getTime())[0] ?? null
  );
}
