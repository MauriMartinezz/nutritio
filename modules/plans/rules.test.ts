import { test } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_MEALS,
  PlanRuleError,
  canEditPlan,
  copyPlanForClient,
  itemTotals,
  parseReorder,
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
      { name: "Lunch", position: 1, items: [{ foodId: 7, grams: 150, note: null, position: 0 }] },
      { name: "Breakfast", position: 0, items: [] },
    ],
  };
  assert.deepEqual(copyPlanForClient(template, "client-1"), {
    name: "Base plan",
    notes: "Drink water",
    clientId: "client-1",
    meals: [
      { name: "Breakfast", position: 0, items: [] },
      { name: "Lunch", position: 1, items: [{ foodId: 7, grams: 150, note: null, position: 0 }] },
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
