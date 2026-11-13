// Admin rules for managing nutritionists. Only admins call these (enforced by the actions).
import {
  NUTRITIONIST_STATUSES,
  type NutritionistStatus,
  type Role,
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

/** Admins may move a nutritionist to any verification status (approve, reject, revoke). */
export function changeNutritionistStatus(
  target: { role: Role; nutritionistStatus: NutritionistStatus | null },
  newStatus: unknown,
): NutritionistStatus {
  if (target.role !== "NUTRITIONIST") {
    throw new InvalidVerificationError("Only nutritionists have a verification status");
  }
  if (!isStatus(newStatus)) throw new InvalidVerificationError(`Unknown status "${String(newStatus)}"`);
  return newStatus;
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
