// Nutritionist verification rules. Only admins call this (enforced by the actions).
import type { NutritionistStatus, Role } from "@/modules/identity/roles";

export type VerificationDecision = "APPROVE" | "REJECT";

export class InvalidVerificationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidVerificationError";
  }
}

/** Returns the new status for a nutritionist awaiting verification. */
export function decideVerification(
  target: { role: Role; nutritionistStatus: NutritionistStatus | null },
  decision: VerificationDecision,
): Exclude<NutritionistStatus, "PENDING"> {
  if (target.role !== "NUTRITIONIST") {
    throw new InvalidVerificationError("Only nutritionists can be verified");
  }
  if (target.nutritionistStatus !== "PENDING") {
    throw new InvalidVerificationError("Only pending nutritionists can be verified");
  }
  return decision === "APPROVE" ? "APPROVED" : "REJECTED";
}
