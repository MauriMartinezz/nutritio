// Meal plan rules: a single daily plan made of ordered meals, each with food items.
// Pure functions; access control lives in ./dal.ts and ./actions.ts.

export const DEFAULT_MEALS = ["Breakfast", "Lunch", "Snack", "Dinner"] as const;

export const MAX_GRAMS = 2000;

export class PlanRuleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PlanRuleError";
  }
}

const text = (value: unknown) => (typeof value === "string" ? value.trim() : "");

function requiredText(value: unknown, label: string, max: number): string {
  const result = text(value);
  if (result.length === 0 || result.length > max) {
    throw new PlanRuleError(`${label} is required (max ${max} characters)`);
  }
  return result;
}

export const parsePlanName = (value: unknown) => requiredText(value, "Plan name", 120);
export const parseMealName = (value: unknown) => requiredText(value, "Meal name", 60);

export function parseNote(value: unknown): string | null {
  const note = text(value);
  if (note.length > 200) throw new PlanRuleError("Note must be at most 200 characters");
  return note || null;
}

export function parsePlanNotes(value: unknown): string | null {
  const notes = text(value);
  if (notes.length > 2000) throw new PlanRuleError("Notes must be at most 2000 characters");
  return notes || null;
}

/** Grams of an item: a whole number greater than 0 and up to 2000. */
export function parseGrams(value: unknown): number {
  const raw = typeof value === "number" ? String(value) : text(value);
  if (!/^\d+$/.test(raw)) throw new PlanRuleError("Grams must be a whole number");
  const grams = Number(raw);
  if (grams <= 0 || grams > MAX_GRAMS) {
    throw new PlanRuleError(`Grams must be between 1 and ${MAX_GRAMS}`);
  }
  return grams;
}

/** Food values per 100 g, already converted from Decimal. Null means unknown. */
export type Nutrients = {
  kcal: number | null;
  proteinG: number | null;
  carbsG: number | null;
  fatG: number | null;
};

export type Totals = {
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  /** Some food value was unknown and counted as 0. */
  incomplete: boolean;
};

const round2 = (value: number) => Math.round(value * 100) / 100;
const NUTRIENT_KEYS = ["kcal", "proteinG", "carbsG", "fatG"] as const;

export function itemTotals(food: Nutrients, grams: number): Totals {
  const totals: Totals = { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0, incomplete: false };
  for (const key of NUTRIENT_KEYS) {
    const per100 = food[key];
    if (per100 === null) totals.incomplete = true;
    else totals[key] = round2((per100 * grams) / 100);
  }
  return totals;
}

export function sumTotals(list: Totals[]): Totals {
  const totals: Totals = { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0, incomplete: false };
  for (const item of list) {
    for (const key of NUTRIENT_KEYS) totals[key] = round2(totals[key] + item[key]);
    totals.incomplete ||= item.incomplete;
  }
  return totals;
}

type Preparation = "RAW" | "COOKED";

/**
 * The raw/cooked toggle: when the food's group has both variants, returns the
 * other one. The item keeps its grams; only the food changes.
 */
export function variantToggle(
  food: { id: number; groupKey: string | null; preparation: Preparation | null },
  groupVariants: { id: number; preparation: Preparation | null }[],
): { foodId: number; preparation: Preparation } | null {
  if (!food.groupKey || !food.preparation) return null;
  const target: Preparation = food.preparation === "RAW" ? "COOKED" : "RAW";
  const other = groupVariants.find((variant) => variant.preparation === target);
  return other ? { foodId: other.id, preparation: target } : null;
}

/** Returns the ids in their new order after moving one up or down (no-op at the edges). */
export function moveInOrder(ids: string[], id: string, direction: "up" | "down"): string[] {
  const index = ids.indexOf(id);
  if (index === -1) throw new PlanRuleError("Item not found in this plan");
  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (swapWith < 0 || swapWith >= ids.length) return ids;
  const result = [...ids];
  [result[index], result[swapWith]] = [result[swapWith], result[index]];
  return result;
}

type PlanContent = {
  name: string;
  notes: string | null;
  meals: {
    name: string;
    position: number;
    items: { foodId: number; grams: number; note: string | null; position: number }[];
  }[];
};

/** A copy of a template for one client. Editing the copy never touches the template. */
export function copyPlanForClient(template: PlanContent, clientId: string) {
  return {
    name: template.name,
    notes: template.notes,
    clientId,
    meals: [...template.meals]
      .sort((a, b) => a.position - b.position)
      .map((meal) => ({
        name: meal.name,
        position: meal.position,
        items: [...meal.items]
          .sort((a, b) => a.position - b.position)
          .map(({ foodId, grams, note, position }) => ({ foodId, grams, note, position })),
      })),
  };
}
