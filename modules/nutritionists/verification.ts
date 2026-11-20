// Admin rules for managing nutritionists. Only admins call these (enforced by the actions).
import {
  NUTRITIONIST_STATUSES,
  type NutritionistStatus,
} from "@/modules/identity/roles";
import {
  InvalidProfileError,
  parseNutritionistProfile,
  type NutritionistProfile,
} from "./profile";

export class InvalidVerificationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidVerificationError";
  }
}

export class InvalidAdminUpdateError extends Error {
  constructor(readonly problems: Record<string, string>) {
    super(`Invalid nutritionist update: ${Object.values(problems).join("; ")}`);
    this.name = "InvalidAdminUpdateError";
  }
}

function isStatus(value: unknown): value is NutritionistStatus {
  return (NUTRITIONIST_STATUSES as readonly unknown[]).includes(value);
}

export type AdminNutritionistUpdate = {
  name: string;
  email: string;
  status: NutritionistStatus;
} & NutritionistProfile;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Validates the admin edit form, reporting every invalid field at once. */
export function parseAdminNutritionistUpdate(
  input: Record<string, unknown>,
  today: Date = new Date(),
): AdminNutritionistUpdate {
  const problems: Record<string, string> = {};

  const name = typeof input.name === "string" ? input.name.trim() : "";
  if (name.length === 0 || name.length > 255) problems.name = "Name is required (max 255 characters)";

  const email = typeof input.email === "string" ? input.email.trim().toLowerCase() : "";
  if (!EMAIL.test(email) || email.length > 255) problems.email = "Email must be valid";

  if (!isStatus(input.status)) problems.status = "Status must be PENDING, APPROVED or REJECTED";

  let profile: NutritionistProfile | null = null;
  try {
    profile = parseNutritionistProfile(input, today);
  } catch (error) {
    if (!(error instanceof InvalidProfileError)) throw error;
    Object.assign(problems, error.problems);
  }

  if (Object.keys(problems).length > 0 || !profile) throw new InvalidAdminUpdateError(problems);

  return { name, email, status: input.status as NutritionistStatus, ...profile };
}

export const REVIEW_NOTE_MAX = 1000;

/** Admin feedback for the nutritionist; blank means no note. */
export function parseReviewNote(raw: unknown): string | null {
  const note = typeof raw === "string" ? raw.trim() : "";
  if (note.length > REVIEW_NOTE_MAX) {
    throw new InvalidVerificationError(`The note can be at most ${REVIEW_NOTE_MAX} characters`);
  }
  return note || null;
}

/** Status after a review: approve, reject, or "save" to keep the current one. */
export function reviewStatus(decision: unknown, current: NutritionistStatus | null): NutritionistStatus {
  if (decision === "save") return current ?? "PENDING";
  if (decision === "APPROVED" || decision === "REJECTED") return decision;
  throw new InvalidVerificationError(`Unknown decision "${String(decision)}"`);
}

/**
 * A nutritionist has a single application: they can send it again only after
 * it was rejected, so there is never more than one pending.
 */
export function assertCanResubmit(status: NutritionistStatus | null): void {
  if (status === "REJECTED") return;
  if (status === "PENDING") throw new InvalidVerificationError("Your application is already waiting for review");
  if (status === "APPROVED") throw new InvalidVerificationError("Your application is already approved");
  throw new InvalidVerificationError("Only nutritionists can send an application");
}
