"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Locale } from "@/lib/i18n/negotiate";
import { getActionLocale } from "@/lib/i18n/server";
import { prisma } from "@/lib/prisma";
import { requireClientAccess } from "@/modules/coaching/dal";
import { requireRole } from "@/modules/identity/dal";
import { setFlash } from "@/modules/ui/set-flash";
import { findEditablePlan, planContentIds, searchFoods } from "./dal";
import { defaultMealNames, planErrors } from "./messages";
import {
  PlanEditsError,
  PlanRuleError,
  copyPlanForClient,
  parseGrams,
  parseMealName,
  parsePlanEdits,
  parsePlanIntent,
  parseReorder,
  parsePlanName,
  variantToggle,
  type PlanEdits,
  type PlanIntent,
} from "./rules";

// Bound arguments (.bind) and button values are sent by the browser and can be tampered
// with, so every action re-checks access from the database through findEditablePlan.

async function requireEditablePlan(planId: string, locale: Locale) {
  const access = await findEditablePlan(planId);
  if (!access) throw new PlanRuleError(planErrors[locale].planNotFound);
  return access;
}

function refresh(planId: string) {
  revalidatePath(`/plans/${planId}`);
}

const defaultMeals = (locale: Locale) => defaultMealNames[locale].meals.map((name, position) => ({ name, position }));

/** New plan for an accepted client (clientId) or a new template (clientId null). */
export async function createPlan(clientId: string | null, formData: FormData) {
  const locale = await getActionLocale();
  const name = parsePlanName(formData.get("name"), locale);

  let nutritionistId: string;
  if (clientId) {
    nutritionistId = (await requireClientAccess(clientId)).nutritionist.id;
  } else {
    const nutritionist = await requireRole("NUTRITIONIST");
    if (nutritionist.nutritionistStatus !== "APPROVED") {
      throw new PlanRuleError(planErrors[locale].mustBeVerified);
    }
    nutritionistId = nutritionist.id;
  }

  const plan = await prisma.mealPlan.create({
    data: { nutritionistId, clientId, name, meals: { create: defaultMeals(locale) } },
    select: { id: true },
  });
  await setFlash(clientId ? "plan-created" : "template-created");
  redirect(`/plans/${plan.id}`);
}

/** Copies one of the nutritionist's templates into a new plan for an accepted client. */
export async function createPlanFromTemplate(clientId: string, formData: FormData) {
  const locale = await getActionLocale();
  const { nutritionist } = await requireClientAccess(clientId);
  const templateId = String(formData.get("templateId") ?? "");

  const template = await prisma.mealPlan.findFirst({
    where: { id: templateId, nutritionistId: nutritionist.id, clientId: null },
    select: {
      name: true,
      notes: true,
      meals: {
        select: {
          name: true,
          position: true,
          servings: true,
          extras: true,
          items: { select: { foodId: true, grams: true, note: true, position: true } },
        },
      },
    },
  });
  if (!template) throw new PlanRuleError(planErrors[locale].templateNotFound);

  const copy = copyPlanForClient(template, clientId);
  const plan = await prisma.mealPlan.create({
    data: {
      nutritionistId: nutritionist.id,
      clientId: copy.clientId,
      name: copy.name,
      notes: copy.notes,
      meals: {
        create: copy.meals.map((meal) => ({
          name: meal.name,
          position: meal.position,
          servings: meal.servings,
          extras: meal.extras,
          items: { create: meal.items },
        })),
      },
    },
    select: { id: true },
  });
  await setFlash(clientId ? "plan-created" : "template-created");
  redirect(`/plans/${plan.id}`);
}

/** Food search for the plan editor's add-food box (nutritionists only, via searchFoods). */
export async function findFoods(query: unknown) {
  return searchFoods(typeof query === "string" ? query : "", await getActionLocale());
}

/** Saves the meal order after a drag and drop. */
export async function reorderMeals(planId: string, orderedIds: unknown) {
  const locale = await getActionLocale();
  await requireEditablePlan(planId, locale);
  const meals = await prisma.meal.findMany({ where: { planId }, select: { id: true } });
  const order = parseReorder(
    meals.map((meal) => meal.id),
    orderedIds,
    locale,
  );
  await prisma.$transaction(
    order.map((id, position) => prisma.meal.update({ where: { id }, data: { position } })),
  );
  refresh(planId);
}

export type PlanEditorState = {
  problems?: Record<string, string>;
  /** What was sent, so a rejected form shows it again after React resets the fields. */
  values?: Record<string, string>;
  saved?: boolean;
  /** What the clicked button did, for the confirmation toast. */
  notice?: "saved" | "foodAdded" | "foodRemoved" | "mealAdded" | "mealRemoved" | "switched";
};

const sentValues = (formData: FormData) =>
  Object.fromEntries(
    [...formData.entries()].filter(
      (entry): entry is [string, string] =>
        typeof entry[1] === "string" && entry[0] !== "intent" && !entry[0].startsWith("$ACTION"),
    ),
  );

/** Field-level problems of the structural part of a button (new meal name, grams of a food to add). */
function structuralProblem(intent: PlanIntent, formData: FormData, locale: Locale): Record<string, string> | null {
  try {
    if (intent.kind === "addMeal") parseMealName(formData.get("newMeal"), locale);
    if (intent.kind === "addItem") parseGrams(formData.get(`add.${intent.foodId}.grams`), locale);
    return null;
  } catch (error) {
    if (!(error instanceof PlanRuleError)) throw error;
    const field = intent.kind === "addItem" ? `add.${intent.foodId}.grams` : "newMeal";
    return { [field]: error.message };
  }
}

async function saveEdits(planId: string, edits: PlanEdits) {
  await prisma.$transaction([
    prisma.mealPlan.update({ where: { id: planId }, data: { name: edits.name, notes: edits.notes } }),
    ...edits.meals.map(({ id, ...data }) => prisma.meal.update({ where: { id }, data })),
    ...edits.items.map(({ id, ...data }) => prisma.mealItem.update({ where: { id }, data })),
  ]);
}

/**
 * The plan editor's single form (used with useActionState). Every button submits all the
 * pending edits: they are validated and saved first, then the clicked button's action runs
 * ("intent"), so adding, removing or switching never loses unsaved changes.
 */
export async function editPlan(planId: string, _previous: PlanEditorState, formData: FormData): Promise<PlanEditorState> {
  const locale = await getActionLocale();
  const t = planErrors[locale];
  const { plan } = await requireEditablePlan(planId, locale);

  let intent: PlanIntent;
  try {
    intent = parsePlanIntent(formData.get("intent") ?? undefined, locale);
  } catch (error) {
    if (error instanceof PlanRuleError) return { problems: { form: error.message }, values: sentValues(formData) };
    throw error;
  }

  if (intent.kind === "delete") {
    await prisma.mealPlan.delete({ where: { id: planId } });
    await setFlash("plan-deleted");
    redirect(plan.clientId ? `/clients/${plan.clientId}` : "/plans");
  }

  // Only rows of this plan can be updated or removed.
  const ids = await planContentIds(planId);
  let edits: PlanEdits;
  try {
    edits = parsePlanEdits(Object.fromEntries(formData), ids, locale);
  } catch (error) {
    if (error instanceof PlanEditsError) return { problems: error.problems, values: sentValues(formData) };
    throw error;
  }
  const problem = structuralProblem(intent, formData, locale);
  if (problem) return { problems: problem, values: sentValues(formData) };
  if ("mealId" in intent && !ids.meals.includes(intent.mealId)) return { problems: { form: t.mealNotFound } };
  if ("itemId" in intent && !ids.items.includes(intent.itemId)) return { problems: { form: t.itemNotFound } };

  await saveEdits(planId, edits);

  switch (intent.kind) {
    case "save":
      refresh(planId);
      return { saved: true, notice: "saved" };
    case "addMeal": {
      const last = await prisma.meal.findFirst({ where: { planId }, orderBy: { position: "desc" }, select: { position: true } });
      const name = parseMealName(formData.get("newMeal"), locale);
      await prisma.meal.create({ data: { planId, name, position: (last?.position ?? -1) + 1 } });
      refresh(planId);
      return { saved: true, notice: "mealAdded" };
    }
    case "removeMeal":
      await prisma.meal.delete({ where: { id: intent.mealId } });
      refresh(planId);
      return { saved: true, notice: "mealRemoved" };
    case "removeItem":
      await prisma.mealItem.delete({ where: { id: intent.itemId } });
      refresh(planId);
      return { saved: true, notice: "foodRemoved" };
    case "toggle": {
      const item = await prisma.mealItem.findUniqueOrThrow({
        where: { id: intent.itemId },
        select: { food: { select: { id: true, groupKey: true, preparation: true } } },
      });
      const variants = item.food.groupKey
        ? await prisma.food.findMany({
            where: { groupKey: item.food.groupKey, preparation: { not: null } },
            select: { id: true, preparation: true },
          })
        : [];
      const toggle = variantToggle(item.food, variants);
      if (!toggle) return { problems: { form: t.noVariant } };
      await prisma.mealItem.update({ where: { id: intent.itemId }, data: { foodId: toggle.foodId } });
      refresh(planId);
      return { saved: true, notice: "switched" };
    }
    case "search":
      // The editor now searches without submitting; kept for old clients: just save.
      refresh(planId);
      return { saved: true, notice: "saved" };
    case "addItem": {
      const food = await prisma.food.findUnique({ where: { id: intent.foodId }, select: { id: true } });
      if (!food) return { problems: { form: t.foodNotFound } };
      const grams = parseGrams(formData.get(`add.${food.id}.grams`), locale);
      const last = await prisma.mealItem.findFirst({
        where: { mealId: intent.mealId },
        orderBy: { position: "desc" },
        select: { position: true },
      });
      await prisma.mealItem.create({
        data: { mealId: intent.mealId, foodId: food.id, grams, position: (last?.position ?? -1) + 1 },
      });
      // No redirect: the page stays put, so the add-food box keeps its search for the next one.
      refresh(planId);
      return { saved: true, notice: "foodAdded" };
    }
  }
  refresh(planId);
  return {};
}
