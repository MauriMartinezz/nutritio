import { formatNumber } from "@/lib/i18n/format";
import { getLocale, getMessages } from "@/lib/i18n/server";
import { planMessages } from "../messages";
import type { Totals } from "../rules";

/** kcal and macros of an item, meal or day. Flags totals that miss some food value. */
export async function MacroSummary({ totals, strong = false }: { totals: Totals; strong?: boolean }) {
  const locale = await getLocale();
  const t = await getMessages(planMessages);
  const format = (value: number) => formatNumber(value, locale, { maximumFractionDigits: 1 });
  return (
    <span className={`font-mono text-sm tabular-nums ${strong ? "font-semibold text-ink" : "font-medium text-secondary"}`}>
      {formatNumber(Math.round(totals.kcal), locale)} kcal · {t.macros.protein} {format(totals.proteinG)} g ·{" "}
      {t.macros.carbs} {format(totals.carbsG)} g · {t.macros.fat} {format(totals.fatG)} g
      {totals.incomplete && (
        <span title={t.incompleteTitle} className="ml-1 font-sans font-semibold text-warning">
          {t.incomplete}
        </span>
      )}
    </span>
  );
}
