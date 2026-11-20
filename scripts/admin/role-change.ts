// Decides the user fields to write when an operator changes someone's role.
// Pure function so it can be unit tested without a database.
import { ROLES, type Role } from "@/modules/identity/roles";

export class InvalidTargetRoleError extends Error {
  constructor(role: unknown) {
    super(`Unknown role "${String(role)}". Use one of: ${ROLES.join(", ")}`);
    this.name = "InvalidTargetRoleError";
  }
}

/**
 * NUTRITIONIST is set as already approved, since an operator is vouching for it.
 * Professional profile fields (dni, license, ...) are left untouched so a role
 * change can be reverted without losing data.
 */
export function roleChange(input: unknown, now: Date = new Date()) {
  const role = typeof input === "string" ? input.toUpperCase() : input;
  if (!(ROLES as readonly unknown[]).includes(role)) throw new InvalidTargetRoleError(input);

  switch (role as Role) {
    case "ADMIN":
      return { role: "ADMIN", nutritionistStatus: null } as const;
    case "NUTRITIONIST":
      return {
        role: "NUTRITIONIST",
        nutritionistStatus: "APPROVED",
        verificationNote: null,
        reviewedAt: now,
      } as const;
    case "CLIENT":
      return {
        role: "CLIENT",
        nutritionistStatus: null,
        verificationNote: null,
        reviewedAt: null,
      } as const;
  }
}
