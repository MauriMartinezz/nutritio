import type { Totals } from "../rules";

const format = (value: number) => (Number.isInteger(value) ? value : value.toFixed(1));

/** kcal and macros of an item, meal or day. Flags totals that miss some food value. */
export function MacroSummary({ totals, strong = false }: { totals: Totals; strong?: boolean }) {
  return (
    <span className={`font-mono text-sm tabular-nums ${strong ? "font-semibold text-ink" : "font-medium text-secondary"}`}>
      {Math.round(totals.kcal)} kcal · P {format(totals.proteinG)} g · C {format(totals.carbsG)} g · F{" "}
      {format(totals.fatG)} g
      {totals.incomplete && (
        <span
          title="Some foods have no data for a value; it was counted as 0"
          className="ml-1 font-sans font-semibold text-warning"
        >
          (incomplete)
        </span>
      )}
    </span>
  );
}
