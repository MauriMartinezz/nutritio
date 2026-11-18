import { test } from "node:test";
import assert from "node:assert/strict";
import { FoodNamesValidationError, planSpanishNames } from "./spanish-names";

const existing = new Set([1, 2, 3, 4]);

test("a raw/cooked entry becomes two grouped variants", () => {
  const plan = planSpanishNames(
    [
      {
        key: "chicken-breast",
        nameEs: "Pechuga de pollo",
        category: "Carnes y aves",
        raw: 1,
        cooked: 2,
        cookedMethodEs: "asada",
      },
    ],
    existing,
  );

  assert.deepEqual(plan, [
    {
      fdcId: 1,
      nameEs: "Pechuga de pollo",
      categoryEs: "Carnes y aves",
      groupKey: "chicken-breast",
      preparation: "RAW",
      preparationNoteEs: null,
    },
    {
      fdcId: 2,
      nameEs: "Pechuga de pollo",
      categoryEs: "Carnes y aves",
      groupKey: "chicken-breast",
      preparation: "COOKED",
      preparationNoteEs: "asada",
    },
  ]);
});

test("an as-is entry has no preparation, so no raw/cooked toggle", () => {
  const plan = planSpanishNames(
    [{ key: "avocado", nameEs: "Palta", category: "Frutas", asIs: 3 }],
    existing,
  );
  assert.deepEqual(plan, [
    {
      fdcId: 3,
      nameEs: "Palta",
      categoryEs: "Frutas",
      groupKey: "avocado",
      preparation: null,
      preparationNoteEs: null,
    },
  ]);
});

function problemsOf(entries: unknown[]): string[] {
  try {
    planSpanishNames(entries, existing);
  } catch (error) {
    assert.ok(error instanceof FoodNamesValidationError);
    return error.problems;
  }
  assert.fail("expected a validation error");
}

test("rejects entries without variants or mixing as-is with raw/cooked", () => {
  const problems = problemsOf([
    { key: "a", nameEs: "A", category: "Otros" },
    { key: "b", nameEs: "B", category: "Otros", asIs: 1, raw: 2 },
  ]);
  assert.equal(problems.length, 2);
});

test("rejects a cooked variant without its cooking method", () => {
  const problems = problemsOf([{ key: "rice", nameEs: "Arroz", category: "Otros", cooked: 1 }]);
  assert.match(problems[0], /cookedMethodEs/);
});

test("rejects unknown, repeated fdcIds and repeated keys, reporting every problem", () => {
  const problems = problemsOf([
    { key: "a", nameEs: "A", category: "Otros", asIs: 99 },
    { key: "b", nameEs: "B", category: "Otros", asIs: 1 },
    { key: "b", nameEs: "C", category: "Otros", asIs: 1 },
  ]);
  assert.equal(problems.length, 3);
  assert.ok(problems.some((p) => /99/.test(p)));
  assert.ok(problems.some((p) => /fdcId 1/.test(p)));
  assert.ok(problems.some((p) => /key "b"/.test(p)));
});

test("rejects entries missing a key, a Spanish name or a category", () => {
  const problems = problemsOf([{ key: "", nameEs: " ", asIs: 1 }]);
  assert.equal(problems.length, 3);
});
