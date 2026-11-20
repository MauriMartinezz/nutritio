import Link from "next/link";
import { buttonLink, callout, card, cardSm, figure, h2, h3, muted } from "@/modules/ui/classes";
import { formatDay, formatNumber, intlLocale } from "@/lib/i18n/format";
import { getLocale, getMessages } from "@/lib/i18n/server";
import { listMyPlans, type PlanView } from "../dal";
import { planMessages } from "../messages";
import { MacroSummary } from "./macro-summary";
import { MealTotals } from "./meal-totals";

/** The signed-in client's plans, read-only, grouped by nutritionist. Render inside <Suspense>. */
export async function MyPlans() {
  const locale = await getLocale();
  const t = await getMessages(planMessages);
  const { plans, expired } = await listMyPlans(locale);
  const expiredNotice = expired.length > 0 && (
    <p role="status" className={callout("danger")}>
      {t.expiredAccess(new Intl.ListFormat(intlLocale(locale), { type: "conjunction" }).format(expired))}
    </p>
  );
  if (plans.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        {expiredNotice}
        <p className={muted}>
          {expired.length > 0 ? t.noActivePlans : t.noAssignedPlans}
        </p>
      </div>
    );
  }

  // Grouped by id: two nutritionists may share a name.
  const byNutritionist = Map.groupBy(plans, (plan) => plan.nutritionist.id);

  return (
    <div className="flex flex-col gap-10">
      {expiredNotice}
      {[...byNutritionist].map(([nutritionistId, nutritionistPlans]) => (
        <section key={nutritionistId} className="flex flex-col gap-5">
          <h2 className={h2}>{t.fromNutritionist(nutritionistPlans[0].nutritionist.name)}</h2>
          {nutritionistPlans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} />
          ))}
        </section>
      ))}
    </div>
  );
}

export async function PlanCard({ plan }: { plan: PlanView }) {
  const locale = await getLocale();
  const t = await getMessages(planMessages);
  const preparation = { RAW: t.raw, COOKED: t.cooked } as const;
  return (
    <article className={card}>
      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h3 className="text-2xl font-semibold tracking-tight">{plan.name}</h3>
            <p className="text-xs text-secondary">{t.updated(formatDay(plan.updatedAt, locale))}</p>
          </div>
          <Link href={`/my-plans/${plan.id}/shopping-list`} className={buttonLink}>
            {t.shoppingList}
          </Link>
        </div>
        {plan.notes && <p className="whitespace-pre-line text-sm">{plan.notes}</p>}
        <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1 rounded-card bg-accent-tint px-4 py-3 text-sm font-semibold text-accent">
          {t.dailyTotal} <MacroSummary totals={plan.totals} strong />
        </p>
      </header>
      {plan.meals.map((meal) => (
        <section key={meal.id} className={cardSm}>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h4 className={h3}>{meal.name}</h4>
            <MealTotals servings={meal.servings} totals={meal.totals} perServing={meal.perServing} />
          </div>
          {meal.servings > 1 && (
            <p className="text-xs text-secondary">
              {t.wholeRecipeHint(formatNumber(meal.servings, locale))}
            </p>
          )}
          {meal.items.length === 0 ? (
            <p className={muted}>{t.nothingPlanned}</p>
          ) : (
            <ul className="flex flex-col gap-2 text-sm">
              {meal.items.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-card bg-surface-muted px-3 py-2.5"
                >
                  <span>
                    <span className={figure}>{formatNumber(item.grams, locale)} g</span> <span className="font-medium">{item.food.label}</span>
                    {item.food.preparation && (
                      <span className="text-secondary"> ({preparation[item.food.preparation]})</span>
                    )}
                    {item.note && <span className="text-secondary"> — {item.note}</span>}
                  </span>
                  <MacroSummary totals={item.totals} />
                </li>
              ))}
            </ul>
          )}
          {meal.extras && (
            <p className="whitespace-pre-line text-sm">
              <span className="text-secondary">{t.extras}</span>
              {meal.extras}
            </p>
          )}
        </section>
      ))}
    </article>
  );
}
