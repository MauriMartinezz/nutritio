import { test } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_MEALS,
  PlanRuleError,
  canEditPlan,
  macroSplit,
  copyPlanForClient,
  dailyTotals,
  itemTotals,
  foldSearchTerm,
  parseMealExtras,
  parseReorder,
  parseServings,
  formatShoppingGrams,
  parsePlanEdits,
  parsePlanIntent,
  PlanEditsError,
  parseShoppingPeriod,
  shoppingList,
  perServing,
  parseGrams,
  parseMealName,
  parsePlanName,
  sumTotals,
  variantToggle,
} from "./rules";

test("a new plan starts with Breakfast, Lunch, Snack and Dinner", () => {
  assert.deepEqual(DEFAULT_MEALS, ["Breakfast", "Lunch", "Snack", "Dinner"]);
});

test("grams must be a whole number greater than 0 and up to 2000", () => {
  assert.equal(parseGrams("150"), 150);
  assert.equal(parseGrams(" 2000 "), 2000);
  for (const bad of ["0", "-5", "2001", "12.5", "", "abc", undefined]) {
    assert.throws(() => parseGrams(bad), PlanRuleError, String(bad));
  }
});

test("plan and meal names are trimmed and required", () => {
  assert.equal(parsePlanName("  Cutting plan "), "Cutting plan");
  assert.equal(parseMealName(" Pre-workout "), "Pre-workout");
  assert.throws(() => parsePlanName("  "), PlanRuleError);
  assert.throws(() => parseMealName("x".repeat(61)), PlanRuleError);
});

const rice = { kcal: 130, proteinG: 2.7, carbsG: 28, fatG: 0.3 };

test("item macros scale the per-100 g values by grams", () => {
  assert.deepEqual(itemTotals(rice, 200), {
    kcal: 260,
    proteinG: 5.4,
    carbsG: 56,
    fatG: 0.6,
    incomplete: false,
  });
});

test("a missing food value counts as 0 and flags the total as incomplete", () => {
  const oil = { kcal: null, proteinG: 0, carbsG: 0, fatG: 100 };
  assert.deepEqual(itemTotals(oil, 10), { kcal: 0, proteinG: 0, carbsG: 0, fatG: 10, incomplete: true });
});

test("meal and day totals add items and keep the incomplete flag", () => {
  const total = sumTotals([itemTotals(rice, 100), itemTotals({ ...rice, kcal: null }, 100)]);
  assert.deepEqual(total, { kcal: 130, proteinG: 5.4, carbsG: 56, fatG: 0.6, incomplete: true });
  assert.deepEqual(sumTotals([]), { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0, incomplete: false });
});

test("the raw/cooked toggle switches to the other variant of the same group", () => {
  const variants = [
    { id: 1, preparation: "RAW" as const },
    { id: 2, preparation: "COOKED" as const },
  ];
  assert.deepEqual(variantToggle({ id: 1, groupKey: "rice", preparation: "RAW" }, variants), {
    foodId: 2,
    preparation: "COOKED",
  });
  assert.deepEqual(variantToggle({ id: 2, groupKey: "rice", preparation: "COOKED" }, variants), {
    foodId: 1,
    preparation: "RAW",
  });
});

test("foods without both variants have no toggle", () => {
  assert.equal(variantToggle({ id: 3, groupKey: null, preparation: null }, []), null);
  assert.equal(
    variantToggle({ id: 1, groupKey: "egg", preparation: "RAW" }, [{ id: 1, preparation: "RAW" }]),
    null,
  );
});

test("using a template copies its meals and items for one client", () => {
  const template = {
    name: "Base plan",
    notes: "Drink water",
    meals: [
      { name: "Lunch", position: 1, servings: 1, extras: null, items: [{ foodId: 7, grams: 150, note: null, position: 0 }] },
      { name: "Breakfast", position: 0, servings: 1, extras: null, items: [] },
    ],
  };
  assert.deepEqual(copyPlanForClient(template, "client-1"), {
    name: "Base plan",
    notes: "Drink water",
    clientId: "client-1",
    meals: [
      { name: "Breakfast", position: 0, servings: 1, extras: null, items: [] },
      { name: "Lunch", position: 1, servings: 1, extras: null, items: [{ foodId: 7, grams: 150, note: null, position: 0 }] },
    ],
  });
});

const author = { id: "n1", nutritionistStatus: "APPROVED" } as const;

test("an approved nutritionist edits their own templates", () => {
  assert.equal(canEditPlan(author, { nutritionistId: "n1", clientId: null }, null), true);
});

test("a client plan is editable only while the link with that client is accepted", () => {
  const plan = { nutritionistId: "n1", clientId: "c1" };
  assert.equal(canEditPlan(author, plan, { status: "ACCEPTED" }), true);
  assert.equal(canEditPlan(author, plan, { status: "PENDING" }), false);
  assert.equal(canEditPlan(author, plan, { status: "REJECTED" }), false);
  assert.equal(canEditPlan(author, plan, null), false);
});

test("nobody edits another nutritionist's plans or templates", () => {
  const other = { id: "n2", nutritionistStatus: "APPROVED" } as const;
  assert.equal(canEditPlan(other, { nutritionistId: "n1", clientId: null }, null), false);
  assert.equal(canEditPlan(other, { nutritionistId: "n1", clientId: "c1" }, { status: "ACCEPTED" }), false);
});

test("a nutritionist who is not approved cannot edit plans", () => {
  for (const nutritionistStatus of ["PENDING", "REJECTED", null] as const) {
    const user = { id: "n1", nutritionistStatus };
    assert.equal(canEditPlan(user, { nutritionistId: "n1", clientId: null }, null), false);
    assert.equal(canEditPlan(user, { nutritionistId: "n1", clientId: "c1" }, { status: "ACCEPTED" }), false);
  }
});

test("a dragged order must contain exactly the plan's meals", () => {
  assert.deepEqual(parseReorder(["a", "b", "c"], ["c", "a", "b"]), ["c", "a", "b"]);
  for (const bad of [["a", "b"], ["a", "b", "c", "d"], ["a", "a", "b"], ["a", "b", "x"], "a,b,c", null]) {
    assert.throws(() => parseReorder(["a", "b", "c"], bad), PlanRuleError, JSON.stringify(bad));
  }
});

test("servings of a recipe: a whole number from 1 to 20", () => {
  assert.equal(parseServings("4"), 4);
  assert.equal(parseServings(" 20 "), 20);
  assert.equal(parseServings(1), 1);
  for (const bad of ["0", "21", "2.5", "-1", "", "abc", undefined]) {
    assert.throws(() => parseServings(bad), PlanRuleError, String(bad));
  }
});

test("recipe extras are free text up to 500 characters, empty means none", () => {
  assert.equal(parseMealExtras("  Lettuce, tomato, oregano  "), "Lettuce, tomato, oregano");
  assert.equal(parseMealExtras("   "), null);
  assert.equal(parseMealExtras(undefined), null);
  assert.equal(parseMealExtras("x".repeat(500))?.length, 500);
  assert.throws(() => parseMealExtras("x".repeat(501)), PlanRuleError);
});

test("per-serving totals divide the whole recipe by its servings", () => {
  const recipe = { kcal: 2000, proteinG: 150, carbsG: 200, fatG: 50, incomplete: true };
  assert.deepEqual(perServing(recipe, 4), { kcal: 500, proteinG: 37.5, carbsG: 50, fatG: 12.5, incomplete: true });
  assert.deepEqual(perServing({ kcal: 100, proteinG: 10, carbsG: 0, fatG: 1, incomplete: false }, 3), {
    kcal: 33.33,
    proteinG: 3.33,
    carbsG: 0,
    fatG: 0.33,
    incomplete: false,
  });
});

test("the daily total adds one serving of each meal", () => {
  const prep = { kcal: 2000, proteinG: 160, carbsG: 200, fatG: 40, incomplete: false };
  const breakfast = { kcal: 400, proteinG: 20, carbsG: 50, fatG: 10, incomplete: false };
  assert.deepEqual(
    dailyTotals([
      { totals: prep, servings: 4 },
      { totals: breakfast, servings: 1 },
    ]),
    { kcal: 900, proteinG: 60, carbsG: 100, fatG: 20, incomplete: false },
  );
});

test("with one serving per meal the daily total is the plain sum of the meals", () => {
  const a = { kcal: 130.5, proteinG: 2.7, carbsG: 28, fatG: 0.3, incomplete: false };
  const b = { kcal: 200, proteinG: 31, carbsG: 0, fatG: 3.6, incomplete: true };
  assert.deepEqual(
    dailyTotals([
      { totals: a, servings: 1 },
      { totals: b, servings: 1 },
    ]),
    sumTotals([a, b]),
  );
});

test("using a template copies each meal's servings and extras", () => {
  const template = {
    name: "Meal prep",
    notes: null,
    meals: [{ name: "Chicken bowl", position: 0, servings: 4, extras: "Lettuce, lemon", items: [] }],
  };
  assert.deepEqual(copyPlanForClient(template, "c1").meals, [
    { name: "Chicken bowl", position: 0, servings: 4, extras: "Lettuce, lemon", items: [] },
  ]);
});

const mealWith = (servings: number, extras: string | null, items: [number, string, number][], name = "Meal") => ({
  name,
  servings,
  extras,
  items: items.map(([id, label, grams]) => ({ grams, food: { id, label } })),
});

test("a weekly shopping list is one serving per day for 7 days: grams / servings * 7", () => {
  const list = shoppingList([mealWith(1, null, [[1, "Rice", 100]]), mealWith(4, null, [[2, "Chicken", 800]])], "weekly");
  assert.deepEqual(list.items, [
    { foodId: 2, label: "Chicken", grams: 1400 },
    { foodId: 1, label: "Rice", grams: 700 },
  ]);
});

test("the same food in several meals is summed into one line, sorted by name", () => {
  const list = shoppingList(
    [mealWith(1, null, [[1, "Rice", 100]]), mealWith(2, null, [[1, "Rice", 300], [3, "Oats", 50]])],
    "weekly",
  );
  assert.deepEqual(list.items, [
    { foodId: 3, label: "Oats", grams: 175 },
    { foodId: 1, label: "Rice", grams: 1750 },
  ]);
});

test("biweekly multiplies the weekly list by 2 and monthly by 4 (14 and 28 days)", () => {
  const meals = [mealWith(3, null, [[1, "Rice", 100]])];
  assert.equal(shoppingList(meals, "weekly").items[0].grams, 233);
  assert.equal(shoppingList(meals, "biweekly").items[0].grams, 467);
  assert.equal(shoppingList(meals, "monthly").items[0].grams, 933);
  assert.equal(shoppingList(meals, "weekly").days, 7);
  assert.equal(shoppingList(meals, "biweekly").days, 14);
  assert.equal(shoppingList(meals, "monthly").days, 28);
});

test("extras are listed apart, without quantities, once per distinct text", () => {
  const list = shoppingList(
    [
      mealWith(1, " Lettuce, tomato ", [], "Lunch"),
      mealWith(1, null, [], "Snack"),
      mealWith(2, "lettuce, tomato", [], "Dinner"),
      mealWith(1, "Oregano", [], "Breakfast"),
    ],
    "monthly",
  );
  assert.deepEqual(list.extras, [
    { text: "Lettuce, tomato", meals: ["Lunch", "Dinner"] },
    { text: "Oregano", meals: ["Breakfast"] },
  ]);
  assert.deepEqual(list.items, []);
});

test("the shopping period is weekly by default; other values are rejected", () => {
  assert.equal(parseShoppingPeriod(undefined), "weekly");
  assert.equal(parseShoppingPeriod(""), "weekly");
  assert.equal(parseShoppingPeriod("biweekly"), "biweekly");
  assert.equal(parseShoppingPeriod("monthly"), "monthly");
  for (const bad of ["daily", "Weekly", ["weekly"], 7]) {
    assert.throws(() => parseShoppingPeriod(bad), PlanRuleError, String(bad));
  }
  assert.throws(() => shoppingList([], "yearly" as never), PlanRuleError);
});

test("shopping grams show whole grams below 1 kg and kilograms with one decimal from 1000 g", () => {
  assert.equal(formatShoppingGrams(999), "999 g");
  assert.equal(formatShoppingGrams(1000), "1.0 kg");
  assert.equal(formatShoppingGrams(1750), "1.8 kg");
});

test("foldSearchTerm lowercases and drops accents so 'limon' matches 'Limón'", () => {
  assert.equal(foldSearchTerm("Limón"), "limon");
  assert.equal(foldSearchTerm("  ÑOQUIS de Calabaza "), "noquis de calabaza");
  assert.equal(foldSearchTerm("pingüino"), "pinguino");
});

test("macroSplit: share of the day's calories from protein, carbs and fat", () => {
  // 150 g P = 600 kcal, 200 g C = 800 kcal, 67 g F = 603 kcal → 2003 kcal from macros.
  assert.deepEqual(macroSplit({ kcal: 2000, proteinG: 150, carbsG: 200, fatG: 67, incomplete: false }), {
    proteinPct: 30,
    carbsPct: 40,
    fatPct: 30,
  });
  assert.equal(macroSplit({ kcal: 0, proteinG: 0, carbsG: 0, fatG: 0, incomplete: false }), null);
});

test("plan parsers speak Spanish when asked", () => {
  assert.throws(() => parseGrams("0", "es"), { name: "PlanRuleError", message: "Los gramos tienen que estar entre 1 y 2000" });
  assert.throws(() => parsePlanName(" "), { message: "Plan name is required (max 120 characters)" });
});

test("shopping quantities use a decimal comma in Spanish", () => {
  assert.equal(formatShoppingGrams(1750, "es"), "1,8 kg");
  assert.equal(formatShoppingGrams(999, "es"), "999 g");
});

const editIds = { meals: ["m1", "m2"], items: ["i1"] };

test("plan edits: the single save reads the plan, every meal and every item of the form", () => {
  const edits = parsePlanEdits(
    {
      name: " Cutting ",
      notes: "",
      "meal.m1.name": " Desayuno ",
      "meal.m1.servings": "2",
      "meal.m1.extras": " lettuce ",
      "item.i1.grams": "150",
      "item.i1.note": "",
      "meal.zz.name": "ignored: not in this plan",
      q: "unrelated",
    },
    editIds,
  );
  assert.deepEqual(edits, {
    name: "Cutting",
    notes: null,
    meals: [{ id: "m1", name: "Desayuno", servings: 2, extras: "lettuce" }],
    items: [{ id: "i1", grams: 150, note: null }],
  });
});

test("plan edits: every invalid field is reported at once, by field name", () => {
  assert.throws(
    () =>
      parsePlanEdits(
        { name: "", notes: "", "meal.m1.name": "Lunch", "meal.m1.servings": "0", "meal.m1.extras": "", "item.i1.grams": "abc", "item.i1.note": "" },
        editIds,
        "es",
      ),
    (error: unknown) => {
      assert.ok(error instanceof PlanEditsError);
      assert.deepEqual(error.problems, {
        name: "El nombre del plan es obligatorio (máximo 120 caracteres)",
        "meal.m1.servings": "Las porciones tienen que estar entre 1 y 20",
        "item.i1.grams": "Los gramos tienen que ser un número entero",
      });
      return true;
    },
  );
});

test("plan intent: the clicked button says what to do after saving", () => {
  assert.deepEqual(parsePlanIntent(undefined), { kind: "save" });
  assert.deepEqual(parsePlanIntent("save"), { kind: "save" });
  assert.deepEqual(parsePlanIntent("addMeal"), { kind: "addMeal" });
  assert.deepEqual(parsePlanIntent("delete"), { kind: "delete" });
  assert.deepEqual(parsePlanIntent("removeMeal:m1"), { kind: "removeMeal", mealId: "m1" });
  assert.deepEqual(parsePlanIntent("search:m1"), { kind: "search", mealId: "m1" });
  assert.deepEqual(parsePlanIntent("removeItem:i1"), { kind: "removeItem", itemId: "i1" });
  assert.deepEqual(parsePlanIntent("toggle:i1"), { kind: "toggle", itemId: "i1" });
  assert.deepEqual(parsePlanIntent("addItem:m1:42"), { kind: "addItem", mealId: "m1", foodId: 42 });
  for (const bad of ["", "nope", "removeMeal:", "addItem:m1:x", "addItem:m1", "toggle:a:b"]) {
    assert.throws(() => parsePlanIntent(bad), PlanRuleError, bad);
  }
});
