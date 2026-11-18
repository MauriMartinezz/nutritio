"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireClientAccess } from "@/modules/coaching/dal";
import { requireRole } from "@/modules/identity/dal";
import { findEditablePlan } from "./dal";
import {
  DEFAULT_MEALS,
  PlanRuleError,
  copyPlanForClient,
  parseGrams,
  parseMealExtras,
  parseMealName,
  parseNote,
  parseReorder,
  parsePlanName,
  parsePlanNotes,
  parseServings,
  variantToggle,
} from "./rules";

// Bound arguments (.bind) are sent by the browser and can be tampered with, so
// every action re-checks access from the database through findEditablePlan.

async function requireEditablePlan(planId: string) {
  const access = await findEditablePlan(planId);
  if (!access) throw new PlanRuleError("Plan not found");
  return access;
}

async function requireEditableMeal(mealId: string) {
  const meal = await prisma.meal.findUnique({ where: { id: mealId }, select: { planId: true } });
  if (!meal) throw new PlanRuleError("Meal not found");
  await requireEditablePlan(meal.planId);
  return meal;
}

async function requireEditableItem(itemId: string) {
  const item = await prisma.mealItem.findUnique({
    where: { id: itemId },
    select: { mealId: true, meal: { select: { planId: true } }, food: { select: { id: true, groupKey: true, preparation: true } } },
  });
  if (!item) throw new PlanRuleError("Item not found");
  await requireEditablePlan(item.meal.planId);
  return item;
}

function refresh(planId: string) {
  revalidatePath(`/plans/${planId}`);
}

const defaultMeals = DEFAULT_MEALS.map((name, position) => ({ name, position }));

/** New plan for an accepted client (clientId) or a new template (clientId null). */
export async function createPlan(clientId: string | null, formData: FormData) {
  const name = parsePlanName(formData.get("name"));

  let nutritionistId: string;
  if (clientId) {
    nutritionistId = (await requireClientAccess(clientId)).nutritionist.id;
  } else {
    const nutritionist = await requireRole("NUTRITIONIST");
    if (nutritionist.nutritionistStatus !== "APPROVED") {
      throw new PlanRuleError("Your profile must be verified to create templates");
    }
    nutritionistId = nutritionist.id;
  }

  const plan = await prisma.mealPlan.create({
    data: { nutritionistId, clientId, name, meals: { create: defaultMeals } },
    select: { id: true },
  });
  redirect(`/plans/${plan.id}`);
}

/** Copies one of the nutritionist's templates into a new plan for an accepted client. */
export async function createPlanFromTemplate(clientId: string, formData: FormData) {
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
  if (!template) throw new PlanRuleError("Template not found");

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
  redirect(`/plans/${plan.id}`);
}

export async function updatePlanDetails(planId: string, formData: FormData) {
  await requireEditablePlan(planId);
  await prisma.mealPlan.update({
    where: { id: planId },
    data: { name: parsePlanName(formData.get("name")), notes: parsePlanNotes(formData.get("notes")) },
  });
  refresh(planId);
}

export async function deletePlan(planId: string) {
  const { plan } = await requireEditablePlan(planId);
  await prisma.mealPlan.delete({ where: { id: planId } });
  redirect(plan.clientId ? `/clients/${plan.clientId}` : "/plans");
}

export async function addMeal(planId: string, formData: FormData) {
  await requireEditablePlan(planId);
  const name = parseMealName(formData.get("name"));
  const last = await prisma.meal.findFirst({
    where: { planId },
    orderBy: { position: "desc" },
    select: { position: true },
  });
  await prisma.meal.create({ data: { planId, name, position: (last?.position ?? -1) + 1 } });
  refresh(planId);
}

export async function renameMeal(mealId: string, formData: FormData) {
  const { planId } = await requireEditableMeal(mealId);
  await prisma.meal.update({ where: { id: mealId }, data: { name: parseMealName(formData.get("name")) } });
  refresh(planId);
}

/** Recipe details of a meal: how many servings it makes and its free-text extras. */
export async function updateMealRecipe(mealId: string, formData: FormData) {
  const { planId } = await requireEditableMeal(mealId);
  await prisma.meal.update({
    where: { id: mealId },
    data: {
      servings: parseServings(formData.get("servings")),
      extras: parseMealExtras(formData.get("extras")),
    },
  });
  refresh(planId);
}

/** Saves the meal order after a drag and drop. */
export async function reorderMeals(planId: string, orderedIds: unknown) {
  await requireEditablePlan(planId);
  const meals = await prisma.meal.findMany({ where: { planId }, select: { id: true } });
  const order = parseReorder(
    meals.map((meal) => meal.id),
    orderedIds,
  );
  await prisma.$transaction(
    order.map((id, position) => prisma.meal.update({ where: { id }, data: { position } })),
  );
  refresh(planId);
}

export async function removeMeal(mealId: string) {
  const { planId } = await requireEditableMeal(mealId);
  await prisma.meal.delete({ where: { id: mealId } });
  refresh(planId);
}

export async function addItem(mealId: string, foodId: number, formData: FormData) {
  const { planId } = await requireEditableMeal(mealId);
  const grams = parseGrams(formData.get("grams"));
  const note = parseNote(formData.get("note"));

  const food = await prisma.food.findUnique({ where: { id: Number(foodId) }, select: { id: true } });
  if (!food) throw new PlanRuleError("Food not found");

  const last = await prisma.mealItem.findFirst({
    where: { mealId },
    orderBy: { position: "desc" },
    select: { position: true },
  });
  await prisma.mealItem.create({
    data: { mealId, foodId: food.id, grams, note, position: (last?.position ?? -1) + 1 },
  });
  revalidatePath(`/plans/${planId}`);
  redirect(`/plans/${planId}`);
}

export async function updateItem(itemId: string, formData: FormData) {
  const { meal } = await requireEditableItem(itemId);
  await prisma.mealItem.update({
    where: { id: itemId },
    data: { grams: parseGrams(formData.get("grams")), note: parseNote(formData.get("note")) },
  });
  refresh(meal.planId);
}

/** Raw/cooked toggle: swaps the item's food for the other variant, keeping the grams. */
export async function toggleItemVariant(itemId: string) {
  const { meal, food } = await requireEditableItem(itemId);
  const variants = food.groupKey
    ? await prisma.food.findMany({
        where: { groupKey: food.groupKey, preparation: { not: null } },
        select: { id: true, preparation: true },
      })
    : [];
  const toggle = variantToggle(food, variants);
  if (!toggle) throw new PlanRuleError("This food has no raw/cooked variant");

  await prisma.mealItem.update({ where: { id: itemId }, data: { foodId: toggle.foodId } });
  refresh(meal.planId);
}

export async function removeItem(itemId: string) {
  const { meal } = await requireEditableItem(itemId);
  await prisma.mealItem.delete({ where: { id: itemId } });
  refresh(meal.planId);
}
