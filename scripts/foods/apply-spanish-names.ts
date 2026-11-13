// Applies prisma/seed/food-names-es.json to the foods table: pnpm foods:names-es
// The file is the source of truth: foods removed from it lose their Spanish data.
import "dotenv/config";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { prisma } from "@/lib/prisma";
import { planSpanishNames } from "@/modules/foods/spanish-names";

const FILE = resolve(import.meta.dirname, "../../prisma/seed/food-names-es.json");

async function main() {
  const entries = JSON.parse(readFileSync(FILE, "utf8"));
  if (!Array.isArray(entries)) throw new Error(`${FILE} must contain a JSON array`);

  const existing = await prisma.food.findMany({
    where: { fdcId: { not: null } },
    select: { fdcId: true },
  });
  const updates = planSpanishNames(entries, new Set(existing.map((food) => food.fdcId!)));
  const fdcIds = updates.map((update) => update.fdcId);

  await prisma.$transaction(
    async (tx) => {
      await tx.food.updateMany({
        where: { groupKey: { not: null }, fdcId: { notIn: fdcIds } },
        data: { nameEs: null, categoryEs: null, groupKey: null, preparation: null, preparationNoteEs: null },
      });
      for (const { fdcId, ...data } of updates) {
        await tx.food.update({ where: { fdcId }, data });
      }
    },
    { timeout: 60_000 },
  );

  console.log(`Applied Spanish names: ${entries.length} foods, ${updates.length} variants`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
