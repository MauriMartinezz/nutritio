import "server-only";
import { prisma } from "@/lib/prisma";
import { hasActiveAccess } from "@/modules/coaching/access";
import { requireClientAccess } from "@/modules/coaching/dal";
import { requireRole, type CurrentUser } from "@/modules/identity/dal";
import { canEditPlan, itemTotals, sumTotals, variantToggle, type Nutrients } from "./rules";

/**
 * The plan if the signed-in nutritionist may edit it, else null. Every plan read
 * or write by a nutritionist goes through here (ids from the client are never trusted).
 */
export async function findEditablePlan(
  planId: string,
): Promise<{ nutritionist: CurrentUser; plan: { id: string; clientId: string | null } } | null> {
  const nutritionist = await requireRole("NUTRITIONIST");

  const plan = await prisma.mealPlan.findUnique({
    where: { id: planId },
    select: { id: true, nutritionistId: true, clientId: true },
  });
  if (!plan) return null;

  const link = plan.clientId
    ? await prisma.nutritionistClient.findUnique({
        where: {
          nutritionistId_clientId: { nutritionistId: nutritionist.id, clientId: plan.clientId },
        },
        select: { status: true },
      })
    : null;

  if (!canEditPlan(nutritionist, plan, link)) return null;
  return { nutritionist, plan: { id: plan.id, clientId: plan.clientId } };
}

const toNumber = (value: { toNumber(): number } | null) => (value === null ? null : value.toNumber());

const FOOD_SELECT = {
  id: true,
  nameEs: true,
  nameEn: true,
  groupKey: true,
  preparation: true,
  preparationNoteEs: true,
  kcal: true,
  proteinG: true,
  carbsG: true,
  fatG: true,
} as const;

export function foodLabel(food: { nameEs: string | null; nameEn: string }) {
  return food.nameEs ?? food.nameEn;
}

type PlanQuery = { id: string } & ({ nutritionistId: string } | { clientId: string });

/** Loads a plan with meals, items and computed totals. The caller has already checked access. */
async function loadPlan(where: PlanQuery) {
  const plan = await prisma.mealPlan.findFirst({
    where,
    select: {
      id: true,
      name: true,
      notes: true,
      clientId: true,
      updatedAt: true,
      client: { select: { id: true, name: true } },
      nutritionist: { select: { id: true, name: true } },
      meals: {
        orderBy: { position: "asc" },
        select: {
          id: true,
          name: true,
          items: {
            orderBy: { position: "asc" },
            select: { id: true, grams: true, note: true, food: { select: FOOD_SELECT } },
          },
        },
      },
    },
  });
  if (!plan) return null;

  // Variants of every grouped food in the plan, for the raw/cooked toggle.
  const groupKeys = [
    ...new Set(plan.meals.flatMap((meal) => meal.items.map((item) => item.food.groupKey))),
  ].filter((key): key is string => key !== null);
  const variants = groupKeys.length
    ? await prisma.food.findMany({
        where: { groupKey: { in: groupKeys }, preparation: { not: null } },
        select: { id: true, groupKey: true, preparation: true },
      })
    : [];

  const meals = plan.meals.map((meal) => {
    const items = meal.items.map((item) => {
      const nutrients: Nutrients = {
        kcal: toNumber(item.food.kcal),
        proteinG: toNumber(item.food.proteinG),
        carbsG: toNumber(item.food.carbsG),
        fatG: toNumber(item.food.fatG),
      };
      const toggle = variantToggle(
        item.food,
        variants.filter((variant) => variant.groupKey === item.food.groupKey),
      );
      return {
        id: item.id,
        grams: item.grams,
        note: item.note,
        food: {
          id: item.food.id,
          label: foodLabel(item.food),
          preparation: item.food.preparation,
          preparationNote: item.food.preparationNoteEs,
        },
        toggle,
        totals: itemTotals(nutrients, item.grams),
      };
    });
    return { id: meal.id, name: meal.name, items, totals: sumTotals(items.map((i) => i.totals)) };
  });

  return {
    id: plan.id,
    name: plan.name,
    notes: plan.notes,
    updatedAt: plan.updatedAt,
    client: plan.client,
    nutritionist: plan.nutritionist,
    meals,
    totals: sumTotals(meals.map((meal) => meal.totals)),
  };
}

export type PlanView = NonNullable<Awaited<ReturnType<typeof loadPlan>>>;

/** A plan for the editor, or null when the nutritionist may not edit it. */
export async function getPlanForEditor(planId: string) {
  const access = await findEditablePlan(planId);
  if (!access) return null;
  return loadPlan({ id: planId, nutritionistId: access.nutritionist.id });
}

/** Plans the signed-in nutritionist wrote for one of their accepted clients. 404 otherwise. */
export async function listClientPlans(clientId: string) {
  const { nutritionist } = await requireClientAccess(clientId);
  return prisma.mealPlan.findMany({
    where: { nutritionistId: nutritionist.id, clientId },
    select: { id: true, name: true, updatedAt: true },
    orderBy: { createdAt: "desc" },
  });
}

/** The signed-in approved nutritionist's templates (plans without a client). */
export async function listTemplates() {
  const nutritionist = await requireRole("NUTRITIONIST");
  if (nutritionist.nutritionistStatus !== "APPROVED") return [];
  return prisma.mealPlan.findMany({
    where: { nutritionistId: nutritionist.id, clientId: null },
    select: { id: true, name: true, updatedAt: true },
    orderBy: { name: "asc" },
  });
}

/** Catalog search: curated Spanish names first, then English USDA names. */
export async function searchFoods(query: string) {
  await requireRole("NUTRITIONIST");
  const term = query.trim().slice(0, 60);
  if (term.length < 2) return [];

  const select = { ...FOOD_SELECT } as const;
  const spanish = await prisma.food.findMany({
    where: { nameEs: { contains: term } },
    select,
    orderBy: { nameEs: "asc" },
    take: 15,
  });
  const english =
    spanish.length < 15
      ? await prisma.food.findMany({
          where: { nameEn: { contains: term }, id: { notIn: spanish.map((food) => food.id) } },
          select,
          orderBy: { nameEn: "asc" },
          take: 15 - spanish.length,
        })
      : [];

  return [...spanish, ...english].map((food) => ({
    id: food.id,
    label: foodLabel(food),
    preparation: food.preparation,
    preparationNote: food.preparationNoteEs,
    kcal: toNumber(food.kcal),
  }));
}

/**
 * The client's own plans, newest first (S6), only from nutritionists whose link is
 * accepted and whose access has not expired. Also returns who the expired ones are.
 */
export async function listMyPlans() {
  const client = await requireRole("CLIENT");
  const links = await prisma.nutritionistClient.findMany({
    where: { clientId: client.id, status: "ACCEPTED" },
    select: {
      nutritionistId: true,
      accessUntil: true,
      autoRenew: true,
      accessAmount: true,
      accessUnit: true,
      nutritionist: { select: { name: true } },
    },
  });
  const now = new Date();
  const isActive = (link: (typeof links)[number]) =>
    hasActiveAccess({ ...link, amount: link.accessAmount, unit: link.accessUnit }, now);
  const active = links.filter(isActive).map((link) => link.nutritionistId);
  const expired = links.filter((link) => !isActive(link)).map((link) => link.nutritionist.name);

  const plans = await prisma.mealPlan.findMany({
    where: { clientId: client.id, nutritionistId: { in: active } },
    select: { id: true },
    orderBy: { createdAt: "desc" },
  });
  const loaded = await Promise.all(plans.map((plan) => loadPlan({ id: plan.id, clientId: client.id })));
  return { plans: loaded.filter((plan): plan is PlanView => plan !== null), expired };
}
