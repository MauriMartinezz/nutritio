import type { NutritionistStatus } from "@/modules/identity/roles";
import type { Tone } from "@/modules/ui/classes";

export const STATUS_TONES: Record<NutritionistStatus, Tone> = {
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "danger",
};

export const STATUS_LABELS: Record<NutritionistStatus, string> = {
  PENDING: "Pending",
  APPROVED: "Verified",
  REJECTED: "Rejected",
};
