import { test } from "node:test";
import assert from "node:assert/strict";
import {
  InvalidClientPreferencesError,
  describePreferences,
  parseClientPreferences,
  type ClientPreferences,
} from "./preferences";

function problemsOf(input: Record<string, unknown>) {
  try {
    parseClientPreferences(input);
  } catch (error) {
    assert.ok(error instanceof InvalidClientPreferencesError);
    return error.problems;
  }
  assert.fail("expected an InvalidClientPreferencesError");
}

const none: ClientPreferences = {
  lowCarb: false,
  vegan: false,
  vegetarian: false,
  glutenFree: false,
  prefersMealPrep: false,
  diabetic: false,
  celiac: false,
  hypertension: false,
  cookingStyle: "NO_PREFERENCE",
  intolerances: null,
  otherConditions: null,
  notes: null,
  sex: null,
};
const woman = { ...none, sex: "FEMALE" } as const;

test("checked checkboxes arrive as 'on' and become true; text is trimmed", () => {
  assert.deepEqual(
    parseClientPreferences({
      lowCarb: "on",
      vegan: "on",
      vegetarian: "on",
      glutenFree: "on",
      prefersMealPrep: "on",
      diabetic: "on",
      celiac: "on",
      hypertension: "on",
      cookingStyle: "BASIC",
      intolerances: " lactose, walnuts ",
      otherConditions: " asthma ",
      notes: " Trains at night ",
      sex: "FEMALE",
    }),
    {
      lowCarb: true,
      vegan: true,
      vegetarian: true,
      glutenFree: true,
      prefersMealPrep: true,
      diabetic: true,
      celiac: true,
      hypertension: true,
      cookingStyle: "BASIC",
      intolerances: "lactose, walnuts",
      otherConditions: "asthma",
      notes: "Trains at night",
      sex: "FEMALE",
    },
  );
});

test("missing checkboxes are false, missing cooking style is NO_PREFERENCE, empty text is null", () => {
  assert.deepEqual(parseClientPreferences({ intolerances: "  ", otherConditions: "", notes: " ", sex: "FEMALE" }), woman);
  assert.deepEqual(parseClientPreferences({ sex: "FEMALE" }), woman);
});

test("sex is required: woman or man", () => {
  assert.equal(parseClientPreferences({ sex: "MALE" }).sex, "MALE");
  assert.deepEqual(problemsOf({}), { sex: "Choose woman or man" });
  assert.deepEqual(problemsOf({ sex: "OTHER" }), { sex: "Choose woman or man" });
});

test("cooking style accepts ELABORATE and rejects unknown values", () => {
  assert.equal(parseClientPreferences({ cookingStyle: "ELABORATE", sex: "MALE" }).cookingStyle, "ELABORATE");
  assert.deepEqual(Object.keys(problemsOf({ cookingStyle: "GOURMET", sex: "MALE" })), ["cookingStyle"]);
});

test("text fields over their limits are rejected", () => {
  assert.deepEqual(Object.keys(problemsOf({ intolerances: "x".repeat(501), sex: "MALE" })), ["intolerances"]);
  assert.deepEqual(Object.keys(problemsOf({ otherConditions: "x".repeat(501), sex: "MALE" })), ["otherConditions"]);
  assert.deepEqual(Object.keys(problemsOf({ notes: "x".repeat(1001), sex: "MALE" })), ["notes"]);
  assert.equal(parseClientPreferences({ notes: "x".repeat(1000), sex: "MALE" }).notes?.length, 1000);
});

test("reports every invalid field at once", () => {
  assert.deepEqual(
    Object.keys(
      problemsOf({
        cookingStyle: "NOPE",
        intolerances: "x".repeat(501),
        otherConditions: "x".repeat(501),
        notes: "x".repeat(1001),
      }),
    ).sort(),
    ["cookingStyle", "intolerances", "notes", "otherConditions", "sex"],
  );
});

test("describePreferences lists readable labels in a stable order", () => {
  assert.deepEqual(
    describePreferences({
      ...none,
      lowCarb: true,
      vegan: true,
      prefersMealPrep: true,
      cookingStyle: "BASIC",
      diabetic: true,
      intolerances: "lactose",
    }),
    ["Low carb", "Vegan", "Meal prep", "Basic meals", "Diabetic", "Intolerant to: lactose"],
  );
  assert.deepEqual(describePreferences({ ...none, sex: "FEMALE", vegan: true }), ["Woman", "Vegan"]);
  assert.deepEqual(describePreferences({ ...none, sex: "MALE" }), ["Man"]);
  assert.deepEqual(
    describePreferences({ ...none, lowCarb: true }),
    ["Low carb"],
  );
  assert.deepEqual(
    describePreferences({
      ...none,
      vegetarian: true,
      glutenFree: true,
      cookingStyle: "ELABORATE",
      celiac: true,
      hypertension: true,
    }),
    ["Vegetarian", "Gluten free", "Elaborate meals", "Celiac", "Hypertension"],
  );
});

test("describePreferences returns nothing when no preference is set", () => {
  assert.deepEqual(describePreferences(none), []);
});
