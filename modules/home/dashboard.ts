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
