// Maps a raw USDA FoodData Central food (JSON download format) to our Food row.
// All USDA nutrient amounts are expressed per 100 g of edible portion.

export type UsdaSource = "USDA_FOUNDATION" | "USDA_SR_LEGACY";

export type UsdaFood = {
  fdcId: number;
  description: string;
  foodCategory?: { description?: string };
  foodNutrients: { nutrient: { id: number }; amount?: number }[];
};

export type MappedFood = {
  fdcId: number;
  source: UsdaSource;
  nameEn: string;
  category: string | null;
  kcal: number | null;
  proteinG: number | null;
  carbsG: number | null;
  fatG: number | null;
};

// USDA nutrient ids, in order of preference for each value.
const ENERGY_KCAL = [1008, 2048, 2047]; // Energy, Atwater specific, Atwater general
const PROTEIN = [1003];
const CARBS = [1005, 1050]; // by difference, by summation
const FAT = [1004];

function pickAmount(food: UsdaFood, nutrientIds: number[]): number | null {
  for (const id of nutrientIds) {
    const match = food.foodNutrients.find(
      (n) => n.nutrient.id === id && typeof n.amount === "number",
    );
    if (match) return match.amount as number;
  }
  return null;
}

export function mapUsdaFood(food: UsdaFood, source: UsdaSource): MappedFood {
  return {
    fdcId: food.fdcId,
    source,
    nameEn: food.description,
    category: food.foodCategory?.description ?? null,
    kcal: pickAmount(food, ENERGY_KCAL),
    proteinG: pickAmount(food, PROTEIN),
    carbsG: pickAmount(food, CARBS),
    fatG: pickAmount(food, FAT),
  };
}
