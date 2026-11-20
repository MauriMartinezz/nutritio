// Meal plan rules: a single daily plan made of ordered meals, each with food items.
// Pure functions; access control lives in ./dal.ts and ./actions.ts.

import { canAccessClient, type LinkStatus } from "@/modules/coaching/links";
import type { NutritionistStatus } from "@/modules/identity/roles";

export const DEFAULT_MEALS = ["Breakfast", "Lunch", "Snack", "Dinner"] as const;

export const MAX_GRAMS = 2000;
export const MAX_SERVINGS = 20;
export const MAX_EXTRAS = 500;

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

/**
 * Accent- and case-insensitive form of a catalog search term ("Limón" -> "limon").
 * Must fold the same characters as FOLDED_FROM / FOLDED_TO in the food search query.
 */
export function foldSearchTerm(value: string): string {
  return value.trim().normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

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

/** Servings a meal (recipe) makes: a whole number from 1 to 20. Item grams are for the whole recipe. */
export function parseServings(value: unknown): number {
  const raw = typeof value === "number" ? String(value) : text(value);
  if (!/^\d+$/.test(raw)) throw new PlanRuleError("Servings must be a whole number");
  const servings = Number(raw);
  if (servings < 1 || servings > MAX_SERVINGS) {
    throw new PlanRuleError(`Servings must be between 1 and ${MAX_SERVINGS}`);
  }
  return servings;
}

/** Free-text extras of a recipe (low-calorie vegetables, condiments...). Empty means none. */
export function parseMealExtras(value: unknown): string | null {
  const extras = text(value);
  if (extras.length > MAX_EXTRAS) {
    throw new PlanRuleError(`Extras must be at most ${MAX_EXTRAS} characters`);
  }
  return extras || null;
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

/** One serving of a recipe: its whole totals divided by the servings it makes. */
export function perServing(totals: Totals, servings: number): Totals {
  const result: Totals = { ...totals };
  for (const key of NUTRIENT_KEYS) result[key] = round2(totals[key] / servings);
  return result;
}

/** What the client eats in a day: one serving of each meal. */
export function dailyTotals(meals: { totals: Totals; servings: number }[]): Totals {
  return sumTotals(meals.map((meal) => perServing(meal.totals, meal.servings)));
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

/** A new order sent by the browser (drag and drop): must be a permutation of the current ids. */
export function parseReorder(currentIds: string[], proposed: unknown): string[] {
  const valid =
    Array.isArray(proposed) &&
    proposed.length === currentIds.length &&
    proposed.every((id) => typeof id === "string" && currentIds.includes(id)) &&
    new Set(proposed).size === proposed.length;
  if (!valid) throw new PlanRuleError("The new order does not match this plan's meals");
  return proposed as string[];
}

type PlanContent = {
  name: string;
  notes: string | null;
  meals: {
    name: string;
    position: number;
    servings: number;
    extras: string | null;
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
        servings: meal.servings,
        extras: meal.extras,
        items: [...meal.items]
          .sort((a, b) => a.position - b.position)
          .map(({ foodId, grams, note, position }) => ({ foodId, grams, note, position })),
      })),
  };
}

/**
 * A plan is edited only by its approved author. A client plan additionally needs
 * the accepted link with that client (same rule as reading the client's data).
 */
export function canEditPlan(
  nutritionist: { id: string; nutritionistStatus: NutritionistStatus | null },
  plan: { nutritionistId: string; clientId: string | null },
  link: { status: LinkStatus } | null,
): boolean {
  if (nutritionist.nutritionistStatus !== "APPROVED") return false;
  if (plan.nutritionistId !== nutritionist.id) return false;
  return plan.clientId === null || canAccessClient(nutritionist.nutritionistStatus, link);
}

export const SHOPPING_PERIODS = ["weekly", "biweekly", "monthly"] as const;
export type ShoppingPeriod = (typeof SHOPPING_PERIODS)[number];

/** Days each list covers: a week, and the weekly list x2 (biweekly) or x4 (monthly). */
export const SHOPPING_DAYS: Record<ShoppingPeriod, number> = { weekly: 7, biweekly: 14, monthly: 28 };

/** The `?list=` search param: weekly when missing, anything unknown is rejected. */
export function parseShoppingPeriod(value: unknown): ShoppingPeriod {
  if (value === undefined || value === "") return "weekly";
  if (typeof value === "string" && (SHOPPING_PERIODS as readonly string[]).includes(value)) {
    return value as ShoppingPeriod;
  }
  throw new PlanRuleError("Unknown shopping list period");
}

type ShoppingMeal = {
  name: string;
  servings: number;
  extras: string | null;
  items: { grams: number; food: { id: number; label: string } }[];
};

/**
 * Shopping list derived from a plan: the client eats one serving of each meal per day,
 * so each food needs (recipe grams / servings) x days, summed across meals and rounded
 * to whole grams. Extras have no quantities and are listed apart, once per distinct text.
 */
export function shoppingList(meals: ShoppingMeal[], period: ShoppingPeriod) {
  if (!Object.hasOwn(SHOPPING_DAYS, period)) throw new PlanRuleError("Unknown shopping list period");
  const days = SHOPPING_DAYS[period];

  const foods = new Map<number, { foodId: number; label: string; grams: number }>();
  const extras = new Map<string, { text: string; meals: string[] }>();
  for (const meal of meals) {
    for (const item of meal.items) {
      const line = foods.get(item.food.id) ?? { foodId: item.food.id, label: item.food.label, grams: 0 };
      line.grams += (item.grams / meal.servings) * days;
      foods.set(item.food.id, line);
    }
    const text = meal.extras?.trim();
    if (text) {
      const key = text.toLowerCase();
      const entry = extras.get(key) ?? { text, meals: [] };
      if (!entry.meals.includes(meal.name)) entry.meals.push(meal.name);
      extras.set(key, entry);
    }
  }

  const items = [...foods.values()]
    .map((line) => ({ ...line, grams: Math.round(line.grams) }))
    .sort((a, b) => a.label.localeCompare(b.label));
  return { period, days, items, extras: [...extras.values()] };
}

/** Grams for display: whole grams below 1 kg, kilograms with one decimal from 1000 g. */
export function formatShoppingGrams(grams: number): string {
  return grams >= 1000 ? `${(Math.round(grams / 100) / 10).toFixed(1)} kg` : `${grams} g`;
}

/**
 * Share of the day's calories that comes from each macro (4 kcal/g protein and
 * carbs, 9 kcal/g fat), rounded so the three add up to 100. Null for an empty plan.
 */
export function macroSplit(totals: Totals): { proteinPct: number; carbsPct: number; fatPct: number } | null {
  const protein = totals.proteinG * 4;
  const carbs = totals.carbsG * 4;
  const fat = totals.fatG * 9;
  const sum = protein + carbs + fat;
  if (sum <= 0) return null;
  const proteinPct = Math.round((protein / sum) * 100);
  const carbsPct = Math.round((carbs / sum) * 100);
  return { proteinPct, carbsPct, fatPct: 100 - proteinPct - carbsPct };
}
