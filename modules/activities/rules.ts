// Physical activities the client logs: what, when, how long and how hard.

export const ACTIVITY_TYPES = {
  STRENGTH: "Strength",
  GYM: "Gym",
  CALISTHENICS: "Calisthenics",
  FOOTBALL: "Football",
  RUNNING: "Running",
  CYCLING: "Cycling",
  SWIMMING: "Swimming",
  WALKING: "Walking",
  YOGA: "Yoga",
  OTHER: "Other",
} as const;
export type ActivityType = keyof typeof ACTIVITY_TYPES;

export const INTENSITIES = { LOW: "Low", MEDIUM: "Medium", HIGH: "High" } as const;
export type Intensity = keyof typeof INTENSITIES;

export const ACTIVITY_LIMITS = {
  customName: 60,
  notes: 500,
  minDurationMinutes: 1,
  maxDurationMinutes: 600,
} as const;

export type ActivityInput = {
  type: ActivityType;
  customName: string | null;
  /** Calendar day, stored as UTC midnight. */
  performedOn: Date;
  durationMinutes: number;
  intensity: Intensity;
  notes: string | null;
};
export type ActivityField = keyof ActivityInput;

export class InvalidActivityError extends Error {
  constructor(readonly problems: Partial<Record<ActivityField, string>>) {
    super(`Invalid activity: ${Object.values(problems).join("; ")}`);
    this.name = "InvalidActivityError";
  }
}

const DAY_MS = 24 * 60 * 60 * 1000;
const text = (value: unknown) => (typeof value === "string" ? value.trim() : "");
const isKey = <T extends object>(map: T, key: string): key is Extract<keyof T, string> =>
  Object.prototype.hasOwnProperty.call(map, key);

/** The local calendar day of `date`, as UTC midnight (how DATE columns come back). */
export function dayKey(date: Date): Date {
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
}

/** "YYYY-MM-DD" of the local calendar day, for <input type="date">. */
export function toDateInputValue(date: Date): string {
  return dayKey(date).toISOString().slice(0, 10);
}

function parseDay(raw: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
  const date = new Date(`${raw}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== raw ? null : date;
}

/**
 * Validates activity form input against `today`, reporting every invalid field
 * at once. The custom name is only kept (and required) for "Other".
 */
export function parseActivity(input: Record<string, unknown>, today: Date): ActivityInput {
  const problems: Partial<Record<ActivityField, string>> = {};

  const rawType = text(input.type);
  const type = isKey(ACTIVITY_TYPES, rawType) ? rawType : null;
  if (!type) problems.type = "Choose an activity type";

  const customName = type === "OTHER" ? text(input.customName) : "";
  if (type === "OTHER" && !customName) problems.customName = "Name the activity";
  else if (customName.length > ACTIVITY_LIMITS.customName) {
    problems.customName = `The activity name must be at most ${ACTIVITY_LIMITS.customName} characters`;
  }

  const performedOn = parseDay(text(input.performedOn));
  const latest = dayKey(today);
  const earliest = new Date(latest);
  earliest.setUTCFullYear(earliest.getUTCFullYear() - 1);
  if (!performedOn || performedOn > latest || performedOn < earliest) {
    problems.performedOn = "The date must be between one year ago and today";
  }

  const rawDuration = text(input.durationMinutes);
  const durationMinutes = Number(rawDuration);
  const { minDurationMinutes, maxDurationMinutes } = ACTIVITY_LIMITS;
  if (!/^\d+$/.test(rawDuration) || durationMinutes < minDurationMinutes || durationMinutes > maxDurationMinutes) {
    problems.durationMinutes = `Duration must be a whole number of minutes between ${minDurationMinutes} and ${maxDurationMinutes}`;
  }

  const rawIntensity = text(input.intensity);
  const intensity = isKey(INTENSITIES, rawIntensity) ? rawIntensity : null;
  if (!intensity) problems.intensity = "Choose an intensity";

  const notes = text(input.notes);
  if (notes.length > ACTIVITY_LIMITS.notes) {
    problems.notes = `Notes must be at most ${ACTIVITY_LIMITS.notes} characters`;
  }

  if (Object.keys(problems).length > 0 || !type || !intensity || !performedOn) {
    throw new InvalidActivityError(problems);
  }

  return {
    type,
    customName: customName || null,
    performedOn,
    durationMinutes,
    intensity,
    notes: notes || null,
  };
}

/** "Football", or the custom name of an "Other" activity. */
export function activityLabel(activity: { type: ActivityType; customName?: string | null }): string {
  if (activity.type === "OTHER" && activity.customName) return activity.customName;
  return ACTIVITY_TYPES[activity.type];
}

/** "45 min", "1 h", "3 h 15 min". */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest} min`;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}

export type WeeklySummary = {
  /** Monday of the current week (UTC midnight). */
  weekStart: Date;
  /** Sunday of the current week (UTC midnight). */
  weekEnd: Date;
  totalMinutes: number;
  count: number;
  /** Most minutes first. */
  byType: { type: ActivityType; minutes: number }[];
};

/** Total minutes, count and minutes per type for the current week (Monday–Sunday). */
export function weeklySummary(
  activities: { type: ActivityType; performedOn: Date; durationMinutes: number }[],
  today: Date,
): WeeklySummary {
  const day = dayKey(today);
  const sinceMonday = (day.getUTCDay() + 6) % 7;
  const weekStart = new Date(day.getTime() - sinceMonday * DAY_MS);
  const weekEnd = new Date(weekStart.getTime() + 6 * DAY_MS);

  const minutesByType = new Map<ActivityType, number>();
  let totalMinutes = 0;
  let count = 0;
  for (const activity of activities) {
    if (activity.performedOn < weekStart || activity.performedOn > weekEnd) continue;
    totalMinutes += activity.durationMinutes;
    count += 1;
    minutesByType.set(activity.type, (minutesByType.get(activity.type) ?? 0) + activity.durationMinutes);
  }

  const byType = [...minutesByType.entries()]
    .map(([type, minutes]) => ({ type, minutes }))
    .sort((a, b) => b.minutes - a.minutes);

  return { weekStart, weekEnd, totalMinutes, count, byType };
}
