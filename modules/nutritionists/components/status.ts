import type { NutritionistStatus } from "@/modules/identity/roles";
import type { Tone } from "@/modules/ui/classes";
import { nutritionistStatusLabels } from "../messages";

export const STATUS_TONES: Record<NutritionistStatus, Tone> = {
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "danger",
};

/** English labels, kept for existing importers; prefer `nutritionistStatusLabels` with the active locale. */
export const STATUS_LABELS: Record<NutritionistStatus, string> = nutritionistStatusLabels.en;

export { nutritionistStatusLabels };
