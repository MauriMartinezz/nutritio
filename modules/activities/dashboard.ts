// Figures for the client's activity dashboard. Pure: unit tested.
import { dayKey, weekStartOf, weeklySummary, type ActivityType, type WeeklySummary } from "./rules";

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_MS = 7 * DAY_MS;

/** Days are calendar days stored at UTC midnight (how DATE columns come back). */
export type ActivityPoint = {
  type: ActivityType;
  customName?: string | null;
  performedOn: Date;
  durationMinutes: number;
};

export type WeekMinutes = { weekStart: Date; minutes: number; count: number };

/** Minutes and activities per week (Monday–Sunday) for the last `weeks` weeks, oldest first, current week last. */
export function weeklyMinutes(activities: ActivityPoint[], today: Date, weeks = 8): WeekMinutes[] {
  const currentWeek = weekStartOf(today).getTime();
  const result = Array.from({ length: weeks }, (_, index) => ({
    weekStart: new Date(currentWeek - (weeks - 1 - index) * WEEK_MS),
    minutes: 0,
    count: 0,
  }));
  for (const activity of activities) {
    const weeksAgo = Math.ceil((currentWeek - activity.performedOn.getTime()) / WEEK_MS);
    const index = weeks - 1 - Math.max(0, weeksAgo);
    // Future days count in the current week; older than the window is skipped.
    if (index < 0) continue;
    result[index].minutes += activity.durationMinutes;
    result[index].count += 1;
  }
  return result;
}

export type FavoriteActivity = { type: ActivityType; customName: string | null; count: number; minutes: number };

/**
 * The most frequent activity in the last `days` days (today included). Ties go
 * to more minutes. "Other" activities group by their name, ignoring case.
 */
export function favoriteActivity(activities: ActivityPoint[], today: Date, days = 28): FavoriteActivity | null {
  const since = dayKey(today).getTime() - (days - 1) * DAY_MS;
  const groups = new Map<string, FavoriteActivity>();
  for (const activity of activities) {
    if (activity.performedOn.getTime() < since) continue;
    const name = activity.type === "OTHER" ? (activity.customName ?? "").trim() : "";
    const key = `${activity.type}:${name.toLowerCase()}`;
    const group = groups.get(key) ?? { type: activity.type, customName: name || null, count: 0, minutes: 0 };
    group.count += 1;
    group.minutes += activity.durationMinutes;
    groups.set(key, group);
  }
  let best: FavoriteActivity | null = null;
  for (const group of groups.values()) {
    if (!best || group.count > best.count || (group.count === best.count && group.minutes > best.minutes)) best = group;
  }
  return best;
}

export type ActivityDashboard = {
  thisWeek: WeeklySummary;
  lastWeek: WeeklySummary;
  /** Last 8 weeks, oldest first. */
  weeks: WeekMinutes[];
  favorite: FavoriteActivity | null;
};

/** This week against last week, minutes per week and the favorite activity. */
export function activityDashboard(activities: ActivityPoint[], today: Date): ActivityDashboard {
  const aWeekAgo = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7, 12);
  return {
    thisWeek: weeklySummary(activities, today),
    lastWeek: weeklySummary(activities, aWeekAgo),
    weeks: weeklyMinutes(activities, today),
    favorite: favoriteActivity(activities, today),
  };
}

/** "+30", "−1 h 15 min" (true minus sign), or null when nothing changed. `format` prints the absolute value. */
export function signedChange(delta: number, format: (value: number) => string): string | null {
  if (delta === 0) return null;
  return `${delta > 0 ? "+" : "−"}${format(Math.abs(delta))}`;
}
