// Imports the downloaded USDA datasets (see download.sh) into the foods table.
// Idempotent: re-running updates USDA values and never overwrites nameEs.
import "dotenv/config";
import { readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../../generated/prisma/client";
import { mapUsdaFood, type UsdaFood, type UsdaSource } from "./map-food";

const DATA_DIR = resolve(import.meta.dirname, "../../data/usda");
const BATCH_SIZE = 500;

const DATASETS: { prefix: string; rootKey: string; source: UsdaSource }[] = [
  {
    prefix: "FoodData_Central_foundation_food_json_",
    rootKey: "FoundationFoods",
    source: "USDA_FOUNDATION",
  },
  {
    prefix: "FoodData_Central_sr_legacy_food_json_",
    rootKey: "SRLegacyFoods",
    source: "USDA_SR_LEGACY",
  },
];

function findJsonFile(prefix: string): string {
  const dir = readdirSync(DATA_DIR).find(
    (name) => name.startsWith(prefix) && !name.endsWith(".zip"),
  );
  if (!dir) {
    throw new Error(
      `Dataset ${prefix}* not found in ${DATA_DIR}. Run "pnpm usda:download" first.`,
    );
  }
  const json = readdirSync(join(DATA_DIR, dir)).find((name) => name.endsWith(".json"));
  if (!json) throw new Error(`No JSON file inside ${join(DATA_DIR, dir)}`);
  return join(DATA_DIR, dir, json);
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is not set");

  const prisma = new PrismaClient({ adapter: new PrismaMariaDb(databaseUrl) });

  try {
    for (const { prefix, rootKey, source } of DATASETS) {
      const file = findJsonFile(prefix);
      const raw = JSON.parse(readFileSync(file, "utf8")) as Record<string, UsdaFood[]>;
      const foods = (raw[rootKey] ?? []).map((food) => mapUsdaFood(food, source));

      for (let i = 0; i < foods.length; i += BATCH_SIZE) {
        const batch = foods.slice(i, i + BATCH_SIZE);
        await prisma.$transaction(
          batch.map(({ fdcId, ...values }) =>
            prisma.food.upsert({
              where: { fdcId },
              create: { fdcId, ...values },
              update: values,
            }),
          ),
        );
      }
      console.log(`${source}: ${foods.length} foods imported`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
