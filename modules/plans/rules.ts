// Meal plan rules: a single daily plan made of ordered meals, each with food items.
// Pure functions; access control lives in ./dal.ts and ./actions.ts.

import { canAccessClient, type LinkStatus } from "@/modules/coaching/links";
import type { NutritionistStatus } from "@/modules/identity/roles";
import type { Locale } from "@/lib/i18n/negotiate";
import { planErrors } from "./messages";

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

function requiredText(value: unknown, max: number, message: (max: number) => string): string {
  const result = text(value);
  if (result.length === 0 || result.length > max) throw new PlanRuleError(message(max));
  return result;
}

export const parsePlanName = (value: unknown, locale: Locale = "en") =>
  requiredText(value, 120, planErrors[locale].planName);
export const parseMealName = (value: unknown, locale: Locale = "en") =>
  requiredText(value, 60, planErrors[locale].mealName);

/**
 * Accent- and case-insensitive form of a catalog search term ("Limón" -> "limon").
 * Must fold the same characters as FOLDED_FROM / FOLDED_TO in the food search query.
 */
export function foldSearchTerm(value: string): string {
  return value.trim().normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

export function parseNote(value: unknown, locale: Locale = "en"): string | null {
  const note = text(value);
  if (note.length > 200) throw new PlanRuleError(planErrors[locale].note(200));
  return note || null;
}

export function parsePlanNotes(value: unknown, locale: Locale = "en"): string | null {
  const notes = text(value);
  if (notes.length > 2000) throw new PlanRuleError(planErrors[locale].planNotes(2000));
  return notes || null;
}

/** Grams of an item: a whole number greater than 0 and up to 2000. */
export function parseGrams(value: unknown, locale: Locale = "en"): number {
  const raw = typeof value === "number" ? String(value) : text(value);
  if (!/^\d+$/.test(raw)) throw new PlanRuleError(planErrors[locale].gramsWhole);
  const grams = Number(raw);
  if (grams <= 0 || grams > MAX_GRAMS) throw new PlanRuleError(planErrors[locale].gramsRange(MAX_GRAMS));
  return grams;
}

/** Servings a meal (recipe) makes: a whole number from 1 to 20. Item grams are for the whole recipe. */
export function parseServings(value: unknown, locale: Locale = "en"): number {
  const raw = typeof value === "number" ? String(value) : text(value);
  if (!/^\d+$/.test(raw)) throw new PlanRuleError(planErrors[locale].servingsWhole);
  const servings = Number(raw);
  if (servings < 1 || servings > MAX_SERVINGS) {
    throw new PlanRuleError(planErrors[locale].servingsRange(MAX_SERVINGS));
  }
  return servings;
}

/** Free-text extras of a recipe (low-calorie vegetables, condiments...). Empty means none. */
export function parseMealExtras(value: unknown, locale: Locale = "en"): string | null {
  const extras = text(value);
  if (extras.length > MAX_EXTRAS) throw new PlanRuleError(planErrors[locale].extras(MAX_EXTRAS));
  return extras || null;
}

/** Every invalid field of the plan editor's single form, keyed by field name. */
export class PlanEditsError extends Error {
  constructor(readonly problems: Record<string, string>) {
    super("Invalid plan edits");
    this.name = "PlanEditsError";
  }
}

export type PlanEdits = {
  name: string;
  notes: string | null;
  meals: { id: string; name: string; servings: number; extras: string | null }[];
  items: { id: string; grams: number; note: string | null }[];
};

/** Field names of the plan editor form, shared by the page and parsePlanEdits. */
export const planField = {
  mealName: (id: string) => `meal.${id}.name`,
  mealServings: (id: string) => `meal.${id}.servings`,
  mealExtras: (id: string) => `meal.${id}.extras`,
  itemGrams: (id: string) => `item.${id}.grams`,
  itemNote: (id: string) => `item.${id}.note`,
} as const;

/**
 * The plan editor's single "Save changes" form: plan name and notes, plus the fields of
 * every meal and item in `ids` that the form sent. Ids outside the plan are ignored, so
 * a tampered form cannot touch another plan. Throws PlanEditsError with every problem.
 */
export function parsePlanEdits(
  input: Record<string, unknown>,
  ids: { meals: string[]; items: string[] },
  locale: Locale = "en",
): PlanEdits {
  const problems: Record<string, string> = {};
  const field = <T>(name: string, parse: (value: unknown, locale: Locale) => T): T => {
    try {
      return parse(input[name], locale);
    } catch (error) {
      if (!(error instanceof PlanRuleError)) throw error;
      problems[name] = error.message;
      return undefined as T;
    }
  };

  const edits: PlanEdits = {
    name: field("name", parsePlanName),
    notes: field("notes", parsePlanNotes),
    meals: ids.meals
      .filter((id) => Object.hasOwn(input, planField.mealName(id)))
      .map((id) => ({
        id,
        name: field(planField.mealName(id), parseMealName),
        servings: field(planField.mealServings(id), parseServings),
        extras: field(planField.mealExtras(id), parseMealExtras),
      })),
    items: ids.items
      .filter((id) => Object.hasOwn(input, planField.itemGrams(id)))
      .map((id) => ({
        id,
        grams: field(planField.itemGrams(id), parseGrams),
        note: field(planField.itemNote(id), parseNote),
      })),
  };
  if (Object.keys(problems).length > 0) throw new PlanEditsError(problems);
  return edits;
}

/** What a button of the plan editor form does once the pending edits are saved. */
export type PlanIntent =
  | { kind: "save" }
  | { kind: "addMeal" }
  | { kind: "delete" }
  | { kind: "removeMeal"; mealId: string }
  | { kind: "search"; mealId: string }
  | { kind: "removeItem"; itemId: string }
  | { kind: "toggle"; itemId: string }
  | { kind: "addItem"; mealId: string; foodId: number };

/** The `intent` value of the clicked button ("removeMeal:<id>", "addItem:<mealId>:<foodId>"...). Missing means save. */
export function parsePlanIntent(value: unknown, locale: Locale = "en"): PlanIntent {
  if (value === undefined || value === null || value === "save") return { kind: "save" };
  const [kind, first, second, ...rest] = typeof value === "string" ? value.split(":") : [];
  const id = (part: string | undefined) => part !== undefined && part.length > 0;
  if (rest.length === 0) {
    if ((kind === "addMeal" || kind === "delete") && first === undefined) return { kind };
    if ((kind === "removeMeal" || kind === "search") && id(first) && second === undefined) {
      return { kind, mealId: first };
    }
    if ((kind === "removeItem" || kind === "toggle") && id(first) && second === undefined) {
      return { kind, itemId: first };
    }
    if (kind === "addItem" && id(first) && second !== undefined && /^\d+$/.test(second)) {
      return { kind, mealId: first, foodId: Number(second) };
    }
  }
  throw new PlanRuleError(planErrors[locale].unknownAction);
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
export function parseReorder(currentIds: string[], proposed: unknown, locale: Locale = "en"): string[] {
  const valid =
    Array.isArray(proposed) &&
    proposed.length === currentIds.length &&
    proposed.every((id) => typeof id === "string" && currentIds.includes(id)) &&
    new Set(proposed).size === proposed.length;
  if (!valid) throw new PlanRuleError(planErrors[locale].reorder);
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
export function formatShoppingGrams(grams: number, locale: Locale = "en"): string {
  if (grams < 1000) return `${grams} g`;
  const kg = (Math.round(grams / 100) / 10).toFixed(1);
  return `${locale === "es" ? kg.replace(".", ",") : kg} kg`;
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
