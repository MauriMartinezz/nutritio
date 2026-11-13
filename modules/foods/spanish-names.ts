// Turns the curated Spanish food list (prisma/seed/food-names-es.json) into
// per-food updates. Each entry groups a food's variants so the plan editor can
// offer a raw/cooked toggle; "as is" foods have a single variant and no toggle.

export type FoodPreparation = "RAW" | "COOKED";

export type FoodNameEntry = {
  key: string;
  nameEs: string;
  category: string;
  raw?: number;
  cooked?: number;
  cookedMethodEs?: string;
  asIs?: number;
};

export type FoodNameUpdate = {
  fdcId: number;
  nameEs: string;
  categoryEs: string;
  groupKey: string;
  preparation: FoodPreparation | null;
  preparationNoteEs: string | null;
};

export class FoodNamesValidationError extends Error {
  constructor(readonly problems: string[]) {
    super(`Invalid food names file:\n- ${problems.join("\n- ")}`);
    this.name = "FoodNamesValidationError";
  }
}

const isBlank = (value: unknown) => typeof value !== "string" || value.trim() === "";

/** Validates every entry (collecting all problems) and returns the updates to apply. */
export function planSpanishNames(
  entries: unknown[],
  existingFdcIds: ReadonlySet<number>,
): FoodNameUpdate[] {
  const problems: string[] = [];
  const updates: FoodNameUpdate[] = [];
  const seenKeys = new Set<string>();
  const seenFdcIds = new Set<number>();

  entries.forEach((raw, index) => {
    const entry = raw as Partial<FoodNameEntry>;
    const label = `entry #${index + 1}${entry.key ? ` (key "${entry.key}")` : ""}`;
    const entryProblems: string[] = [];

    if (isBlank(entry.key)) entryProblems.push(`${label}: missing key`);
    else if (seenKeys.has(entry.key!)) entryProblems.push(`${label}: key "${entry.key}" is repeated`);
    if (isBlank(entry.nameEs)) entryProblems.push(`${label}: missing nameEs`);
    if (isBlank(entry.category)) entryProblems.push(`${label}: missing category`);

    const variants: [number | undefined, FoodPreparation | null][] = [
      [entry.raw, "RAW"],
      [entry.cooked, "COOKED"],
      [entry.asIs, null],
    ];
    const present = variants.filter(([fdcId]) => fdcId !== undefined);

    if (present.length === 0) {
      entryProblems.push(`${label}: needs asIs, or raw and/or cooked`);
    } else if (entry.asIs !== undefined && present.length > 1) {
      entryProblems.push(`${label}: asIs cannot be combined with raw/cooked`);
    }
    if (entry.cooked !== undefined && isBlank(entry.cookedMethodEs)) {
      entryProblems.push(`${label}: cooked variant needs cookedMethodEs`);
    }

    for (const [fdcId] of present) {
      if (!Number.isInteger(fdcId) || !existingFdcIds.has(fdcId!)) {
        entryProblems.push(`${label}: fdcId ${fdcId} does not exist in foods`);
      } else if (seenFdcIds.has(fdcId!)) {
        entryProblems.push(`${label}: fdcId ${fdcId} is used by another entry`);
      }
    }

    if (!isBlank(entry.key)) seenKeys.add(entry.key!);
    present.forEach(([fdcId]) => seenFdcIds.add(fdcId!));

    if (entryProblems.length > 0) {
      problems.push(...entryProblems);
      return;
    }

    for (const [fdcId, preparation] of present) {
      updates.push({
        fdcId: fdcId!,
        nameEs: entry.nameEs!.trim(),
        categoryEs: entry.category!.trim(),
        groupKey: entry.key!,
        preparation,
        preparationNoteEs: preparation === "COOKED" ? entry.cookedMethodEs!.trim() : null,
      });
    }
  });

  if (problems.length > 0) throw new FoodNamesValidationError(problems);
  return updates;
}
