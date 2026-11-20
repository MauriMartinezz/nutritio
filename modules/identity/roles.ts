import type { Locale } from "@/lib/i18n/negotiate";
// Identity domain rules: roles and nutritionist verification at sign-up.
// Pure functions, no framework imports, so they can be unit tested.
import {
  PROFILE_FIELDS,
  parseNutritionistProfile,
  type NutritionistProfile,
} from "@/modules/nutritionists/profile";

export const ROLES = ["ADMIN", "NUTRITIONIST", "CLIENT"] as const;
export type Role = (typeof ROLES)[number];

export const NUTRITIONIST_STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const;
export type NutritionistStatus = (typeof NUTRITIONIST_STATUSES)[number];

/** Roles a person can choose when registering. ADMIN is never self-assigned. */
export const SELF_ASSIGNABLE_ROLES = ["CLIENT", "NUTRITIONIST"] as const;
export type SelfAssignableRole = (typeof SELF_ASSIGNABLE_ROLES)[number];

/** Fields only the system (admin actions, sign-up rules) may set after sign-up. */
const PRIVILEGED_FIELDS = ["role", "nutritionistStatus", ...PROFILE_FIELDS] as const;

export class InvalidRoleError extends Error {
  constructor(role: unknown) {
    super(`Role "${String(role)}" cannot be chosen at sign-up`);
    this.name = "InvalidRoleError";
  }
}

export class UnexpectedProfileError extends Error {
  constructor() {
    super("Only nutritionists can provide professional profile data");
    this.name = "UnexpectedProfileError";
  }
}

export class PrivilegedFieldChangeError extends Error {
  constructor(field: string) {
    super(`Field "${field}" cannot be changed through the profile API`);
    this.name = "PrivilegedFieldChangeError";
  }
}

function isSelfAssignableRole(value: unknown): value is SelfAssignableRole {
  return (SELF_ASSIGNABLE_ROLES as readonly unknown[]).includes(value);
}

/**
 * Decides the role, verification status and profile of a user being created.
 * Whatever status the input carries is ignored: nutritionists always start PENDING.
 * Nutritionists must provide a valid profile; clients must not send profile fields.
 */
export function prepareNewUser(
  input: Record<string, unknown>,
  today: Date = new Date(),
  locale: Locale = "en",
):
  | { role: "CLIENT"; nutritionistStatus: null }
  | ({ role: "NUTRITIONIST"; nutritionistStatus: "PENDING" } & NutritionistProfile) {
  const role = input.role ?? "CLIENT";
  if (!isSelfAssignableRole(role)) throw new InvalidRoleError(role);

  if (role === "CLIENT") {
    const sentProfile = PROFILE_FIELDS.some(
      (field) => input[field] !== undefined && input[field] !== null && input[field] !== "",
    );
    if (sentProfile) throw new UnexpectedProfileError();
    return { role, nutritionistStatus: null };
  }

  return { role, nutritionistStatus: "PENDING", ...parseNutritionistProfile(input, today, locale) };
}

/** Rejects user updates (coming from the auth API) that touch privileged fields. */
export function assertNoPrivilegedChanges(update: Record<string, unknown>): void {
  for (const field of PRIVILEGED_FIELDS) {
    if (field in update) throw new PrivilegedFieldChangeError(field);
  }
}
