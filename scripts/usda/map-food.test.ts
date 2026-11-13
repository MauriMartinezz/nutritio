import { test } from "node:test";
import assert from "node:assert/strict";
import { mapUsdaFood, type UsdaFood } from "./map-food";

const nutrient = (id: number, amount: number) => ({ nutrient: { id }, amount });

const baseFood: UsdaFood = {
  fdcId: 171477,
  description: "Chicken, broilers or fryers, breast, meat only, raw",
  foodCategory: { description: "Poultry Products" },
  foodNutrients: [
    nutrient(1008, 120),
    nutrient(1003, 22.5),
    nutrient(1005, 0),
    nutrient(1004, 2.62),
  ],
};

test("maps a USDA food to per-100g macros", () => {
  assert.deepEqual(mapUsdaFood(baseFood, "USDA_SR_LEGACY"), {
    fdcId: 171477,
    source: "USDA_SR_LEGACY",
    nameEn: "Chicken, broilers or fryers, breast, meat only, raw",
    category: "Poultry Products",
    kcal: 120,
    proteinG: 22.5,
    carbsG: 0,
    fatG: 2.62,
  });
});

test("falls back to Atwater specific, then general energy when Energy (1008) is missing", () => {
  const withSpecific = mapUsdaFood(
    { ...baseFood, foodNutrients: [nutrient(2047, 110), nutrient(2048, 115)] },
    "USDA_FOUNDATION",
  );
  assert.equal(withSpecific.kcal, 115);

  const withGeneral = mapUsdaFood(
    { ...baseFood, foodNutrients: [nutrient(2047, 110)] },
    "USDA_FOUNDATION",
  );
  assert.equal(withGeneral.kcal, 110);
});

test("falls back to carbohydrate by summation (1050) when by difference (1005) is missing", () => {
  const food = mapUsdaFood(
    { ...baseFood, foodNutrients: [nutrient(1050, 12.3)] },
    "USDA_FOUNDATION",
  );
  assert.equal(food.carbsG, 12.3);
});

test("leaves missing values as null instead of inventing them", () => {
  const food = mapUsdaFood(
    { ...baseFood, foodCategory: undefined, foodNutrients: [] },
    "USDA_FOUNDATION",
  );
  assert.equal(food.category, null);
  assert.equal(food.kcal, null);
  assert.equal(food.proteinG, null);
  assert.equal(food.carbsG, null);
  assert.equal(food.fatG, null);
});
