// Identity domain rules: roles and nutritionist verification at sign-up.
// Pure functions, no framework imports, so they can be unit tested.

export const ROLES = ["ADMIN", "NUTRITIONIST", "CLIENT"] as const;
export type Role = (typeof ROLES)[number];

export const NUTRITIONIST_STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const;
export type NutritionistStatus = (typeof NUTRITIONIST_STATUSES)[number];

/** Roles a person can choose when registering. ADMIN is never self-assigned. */
export const SELF_ASSIGNABLE_ROLES = ["CLIENT", "NUTRITIONIST"] as const;
export type SelfAssignableRole = (typeof SELF_ASSIGNABLE_ROLES)[number];

/** Fields only the system (admin actions, sign-up rules) may set. */
const PRIVILEGED_FIELDS = ["role", "nutritionistStatus"] as const;

export class InvalidRoleError extends Error {
  constructor(role: unknown) {
    super(`Role "${String(role)}" cannot be chosen at sign-up`);
    this.name = "InvalidRoleError";
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
 * Decides the role and verification status of a user being created.
 * Whatever status the input carries is ignored: nutritionists always start PENDING.
 */
export function prepareNewUser(input: { role?: unknown; nutritionistStatus?: unknown }): {
  role: SelfAssignableRole;
  nutritionistStatus: NutritionistStatus | null;
} {
  const role = input.role ?? "CLIENT";
  if (!isSelfAssignableRole(role)) throw new InvalidRoleError(role);

  return {
    role,
    nutritionistStatus: role === "NUTRITIONIST" ? "PENDING" : null,
  };
}

/** Rejects user updates (coming from the auth API) that touch privileged fields. */
export function assertNoPrivilegedChanges(update: Record<string, unknown>): void {
  for (const field of PRIVILEGED_FIELDS) {
    if (field in update) throw new PrivilegedFieldChangeError(field);
  }
}
