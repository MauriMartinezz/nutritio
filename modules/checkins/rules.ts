// Periodic check-ins: the nutritionist agrees a frequency (in days) with each
// client, and the client reports weight, whether they completed the agreed
// workouts, a few 1–5 ratings and notes.

export const CHECK_IN_LIMITS = {
  minWeightKg: 20,
  maxWeightKg: 400,
  minRating: 1,
  maxRating: 5,
  /** Diet adherence, in percent (slider step 5). */
  maxDietAdherence: 100,
  dietAdherenceStep: 5,
  discomfortNotes: 500,
  notes: 2000,
  minEveryDays: 1,
  maxEveryDays: 90,
} as const;

/** Quick values offered when agreeing the frequency. */
export const FREQUENCY_PRESETS = [7, 14, 15, 30] as const;

export const RATINGS = {
  sleep: "Sleep",
  energy: "Energy",
  hunger: "Hunger",
} as const;
export type RatingField = keyof typeof RATINGS;

export const COMPLETED_WORKOUTS_LABEL = "Completed the agreed workouts";

export const GYM_PERFORMANCE = {
  IMPROVED: "Improved",
  SAME: "Stayed the same",
  DROPPED: "Dropped",
} as const;
export type GymPerformance = keyof typeof GYM_PERFORMANCE;

/** Asked only to women whose nutritionist turned it on. */
export const CYCLE_QUESTION = "On your period or in the week before it";
export const CYCLE_HISTORY_LABEL = "Period or week before";

/** The cycle question only shows to women whose nutritionist turned it on. */
export function asksCycle(askCycle: boolean, sex: "FEMALE" | "MALE" | null): boolean {
  return askCycle && sex === "FEMALE";
}

export type CheckInInput = Record<RatingField, number> & {
  weightKg: number;
  completedWorkouts: boolean;
  /** Optional: not everyone trains at a gym. */
  gymPerformance: GymPerformance | null;
  /** How much of the diet the client could follow, 0–100 %. */
  dietAdherence: number;
  discomfort: boolean;
  discomfortNotes: string | null;
  notes: string | null;
  /** Null when the nutritionist didn't ask about the menstrual cycle. */
  menstruating: boolean | null;
};
export type CheckInField = keyof CheckInInput;

export class InvalidCheckInError extends Error {
  constructor(readonly problems: Partial<Record<CheckInField, string>>) {
    super(`Invalid check-in: ${Object.values(problems).join("; ")}`);
    this.name = "InvalidCheckInError";
  }
}

export class CheckInRuleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CheckInRuleError";
  }
}

const DAY_MS = 24 * 60 * 60 * 1000;
const text = (value: unknown) => (typeof value === "string" ? value.trim() : "");

/**
 * Validates check-in form input (the discomfort checkbox arrives as "on"),
 * reporting every invalid field at once. The menstrual cycle answer is only
 * read, and then required, when `askCycle` is on.
 */
export function parseCheckIn(
  input: Record<string, unknown>,
  { askCycle = false }: { askCycle?: boolean } = {},
): CheckInInput {
  const problems: Partial<Record<CheckInField, string>> = {};
  const { minWeightKg, maxWeightKg, minRating, maxRating } = CHECK_IN_LIMITS;

  const rawWeight = text(input.weightKg).replace(",", ".");
  const weightKg = Number(rawWeight);
  if (!/^\d+(\.\d{1,2})?$/.test(rawWeight) || weightKg < minWeightKg || weightKg > maxWeightKg) {
    problems.weightKg = `Weight must be between ${minWeightKg} and ${maxWeightKg} kg`;
  }

  const completedWorkouts = input.completedWorkouts === "yes";
  if (input.completedWorkouts !== "yes" && input.completedWorkouts !== "no") {
    problems.completedWorkouts = `${COMPLETED_WORKOUTS_LABEL}: choose yes or no`;
  }

  const rawGym = text(input.gymPerformance);
  const gymPerformance = rawGym === "" ? null : (rawGym as GymPerformance);
  if (gymPerformance !== null && !(gymPerformance in GYM_PERFORMANCE)) {
    problems.gymPerformance = "Gym performance must be improved, the same or dropped";
  }

  const ratings = {} as Record<RatingField, number>;
  for (const [field, label] of Object.entries(RATINGS) as [RatingField, string][]) {
    const raw = text(input[field]);
    const value = Number(raw);
    if (!/^\d+$/.test(raw) || value < minRating || value > maxRating) {
      problems[field] = `${label}: choose a rating from ${minRating} to ${maxRating}`;
    }
    ratings[field] = value;
  }

  const rawAdherence = text(input.dietAdherence);
  const dietAdherence = Number(rawAdherence);
  if (!/^\d+$/.test(rawAdherence) || dietAdherence > CHECK_IN_LIMITS.maxDietAdherence) {
    problems.dietAdherence = `Diet followed must be a percentage from 0 to ${CHECK_IN_LIMITS.maxDietAdherence}`;
  }

  const discomfort = input.discomfort === "on";
  const discomfortNotes = discomfort ? text(input.discomfortNotes) : "";
  if (discomfortNotes.length > CHECK_IN_LIMITS.discomfortNotes) {
    problems.discomfortNotes = `Discomfort details must be at most ${CHECK_IN_LIMITS.discomfortNotes} characters`;
  }
  const notes = text(input.notes);
  if (notes.length > CHECK_IN_LIMITS.notes) {
    problems.notes = `Notes must be at most ${CHECK_IN_LIMITS.notes} characters`;
  }

  let menstruating: boolean | null = null;
  if (askCycle) {
    if (input.menstruating === "yes" || input.menstruating === "no") menstruating = input.menstruating === "yes";
    else problems.menstruating = `${CYCLE_QUESTION}: choose yes or no`;
  }

  if (Object.keys(problems).length > 0) throw new InvalidCheckInError(problems);

  return {
    weightKg,
    completedWorkouts,
    gymPerformance,
    ...ratings,
    dietAdherence,
    discomfort,
    discomfortNotes: discomfortNotes || null,
    notes: notes || null,
    menstruating,
  };
}

/** Days between check-ins: a whole number from 1 to 90. */
export function parseFrequency(value: unknown): number {
  const raw = text(value);
  const days = Number(raw);
  const { minEveryDays, maxEveryDays } = CHECK_IN_LIMITS;
  if (!/^\d+$/.test(raw) || days < minEveryDays || days > maxEveryDays) {
    throw new CheckInRuleError(`Frequency must be a whole number of days between ${minEveryDays} and ${maxEveryDays}`);
  }
  return days;
}

export type CheckInSchedule = { checkInEveryDays: number | null; startedAt: Date | null };

/** Due date: N days after the last check-in, or after the link started. Null without a frequency. */
export function nextCheckInDue(link: CheckInSchedule, lastCheckInAt: Date | null): Date | null {
  if (!link.checkInEveryDays) return null;
  const base = lastCheckInAt ?? link.startedAt;
  if (!base) return null;
  return new Date(base.getTime() + link.checkInEveryDays * DAY_MS);
}

export type CheckInState = "DUE" | "UPCOMING" | "NOT_SCHEDULED";
export type CheckInStatus = { state: CheckInState; daysLeft: number };

export function checkInStatus(due: Date | null, now: Date): CheckInStatus {
  if (!due) return { state: "NOT_SCHEDULED", daysLeft: 0 };
  if (now >= due) return { state: "DUE", daysLeft: 0 };
  return { state: "UPCOMING", daysLeft: Math.ceil((due.getTime() - now.getTime()) / DAY_MS) };
}

/** Readable status, e.g. "Check-in due" or "Next check-in in 3 days". */
export function describeCheckInStatus(status: CheckInStatus): string {
  if (status.state === "NOT_SCHEDULED") return "No check-in schedule yet";
  if (status.state === "DUE") return "Check-in due";
  return `Next check-in in ${status.daysLeft} ${status.daysLeft === 1 ? "day" : "days"}`;
}
