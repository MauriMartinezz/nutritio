// Pure helpers for the nutritionist dashboard on the home page.

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

/** "Just now", "20 min ago", "3 h ago", "Yesterday", "3 days ago", then the date. */
export function relativeTime(at: Date, now: Date): string {
  const elapsed = now.getTime() - at.getTime();
  if (elapsed < MINUTE_MS) return "Just now";
  if (elapsed < HOUR_MS) return `${Math.floor(elapsed / MINUTE_MS)} min ago`;
  if (elapsed < DAY_MS) return `${Math.floor(elapsed / HOUR_MS)} h ago`;
  if (elapsed < 2 * DAY_MS) return "Yesterday";
  if (elapsed < 7 * DAY_MS) return `${Math.floor(elapsed / DAY_MS)} days ago`;
  return at.toLocaleDateString();
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
export function checkInKpi(status: CheckInStatusLike | null): { value: string; hint: string } {
  if (!status) return { value: "—", hint: "No nutritionist yet" };
  if (status.state === "NOT_SCHEDULED") return { value: "—", hint: "No schedule yet" };
  if (status.state === "DUE") return { value: "Due", hint: "Send it today" };
  return {
    value: `${status.daysLeft} ${status.daysLeft === 1 ? "day" : "days"}`,
    hint: status.due ? `On ${status.due.toLocaleDateString()}` : "Scheduled",
  };
}

/** "Oats 80 g · Yogurt 150 g · Walnuts 15 g + 2 more". */
export function mealSummary(items: { food: { label: string }; grams: number }[], shown = 3): string {
  if (items.length === 0) return "No foods yet";
  const listed = items.slice(0, shown).map((item) => `${item.food.label} ${item.grams} g`).join(" · ");
  return items.length > shown ? `${listed} + ${items.length - shown} more` : listed;
}

/** The soonest accepted meeting that has not started yet, or null. */
export function nextMeeting<T extends { status: string; scheduledFor: Date | null }>(meetings: T[], now: Date): T | null {
  return (
    meetings
      .filter((meeting) => meeting.status === "ACCEPTED" && meeting.scheduledFor && meeting.scheduledFor > now)
      .sort((a, b) => a.scheduledFor!.getTime() - b.scheduledFor!.getTime())[0] ?? null
  );
}
