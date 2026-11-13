import type { Totals } from "../rules";

const format = (value: number) => (Number.isInteger(value) ? value : value.toFixed(1));

/** kcal and macros of an item, meal or day. Flags totals that miss some food value. */
export function MacroSummary({ totals, strong = false }: { totals: Totals; strong?: boolean }) {
  return (
    <span className={`text-sm ${strong ? "font-medium" : "text-zinc-500"}`}>
      {Math.round(totals.kcal)} kcal · P {format(totals.proteinG)} g · C {format(totals.carbsG)} g · F{" "}
      {format(totals.fatG)} g
      {totals.incomplete && (
        <span
          title="Some foods have no data for a value; it was counted as 0"
          className="ml-1 text-amber-600 dark:text-amber-400"
        >
          (incomplete)
        </span>
      )}
    </span>
  );
}
