import { getMessages } from "@/lib/i18n/server";
import { planMessages } from "../messages";
import type { Totals } from "../rules";
import { MacroSummary } from "./macro-summary";

type Props = {
  servings: number;
  totals: Totals;
  perServing: Totals;
  strong?: boolean;
};

/**
 * Totals of a meal (a recipe). With one serving it is a single line; with more it
 * shows the whole recipe and one serving (what the client eats per day).
 */
export async function MealTotals({ servings, totals, perServing, strong = false }: Props) {
  if (servings === 1) return <MacroSummary totals={totals} strong={strong} />;
  const t = await getMessages(planMessages);
  return (
    <div className="flex flex-col gap-1 text-sm">
      <p>
        <span className="text-secondary">
          {t.makes}
          <span className="font-mono font-semibold tabular-nums">{servings}</span>
          {t.servingsWholeRecipe}
        </span>
        <MacroSummary totals={totals} />
      </p>
      <p>
        <span className={strong ? "font-semibold text-ink" : "text-secondary"}>{t.perServing}</span>
        <MacroSummary totals={perServing} strong={strong} />
      </p>
    </div>
  );
}
