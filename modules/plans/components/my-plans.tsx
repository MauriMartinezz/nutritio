import Link from "next/link";
import { buttonLink, callout, card, cardSm, figure, h2, h3, muted } from "@/modules/ui/classes";
import { listMyPlans, type PlanView } from "../dal";
import { MacroSummary } from "./macro-summary";
import { MealTotals } from "./meal-totals";

const PREPARATION_LABELS = { RAW: "raw", COOKED: "cooked" } as const;

/** The signed-in client's plans, read-only, grouped by nutritionist. Render inside <Suspense>. */
export async function MyPlans() {
  const { plans, expired } = await listMyPlans();
  const expiredNotice = expired.length > 0 && (
    <p role="status" className={callout("danger")}>
      Your access with {expired.join(", ")} has expired. Ask them to renew it to see their plans again.
    </p>
  );
  if (plans.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        {expiredNotice}
        <p className={muted}>
          {expired.length > 0
            ? "You have no active meal plans."
            : "Your nutritionists have not assigned you a plan yet."}
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
          <h2 className={h2}>From {nutritionistPlans[0].nutritionist.name}</h2>
          {nutritionistPlans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} />
          ))}
        </section>
      ))}
    </div>
  );
}

export function PlanCard({ plan }: { plan: PlanView }) {
  return (
    <article className={card}>
      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h3 className="text-2xl font-semibold tracking-tight">{plan.name}</h3>
            <p className="text-xs text-secondary">Updated {plan.updatedAt.toLocaleDateString()}</p>
          </div>
          <Link href={`/my-plans/${plan.id}/shopping-list`} className={buttonLink}>
            Shopping list
          </Link>
        </div>
        {plan.notes && <p className="whitespace-pre-line text-sm">{plan.notes}</p>}
        <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1 rounded-card bg-accent-tint px-4 py-3 text-sm font-semibold text-accent">
          Daily total: <MacroSummary totals={plan.totals} strong />
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
              Quantities below are for the whole recipe ({meal.servings} servings). Eat one serving per day.
            </p>
          )}
          {meal.items.length === 0 ? (
            <p className={muted}>Nothing planned.</p>
          ) : (
            <ul className="flex flex-col gap-2 text-sm">
              {meal.items.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-card bg-surface-muted px-3 py-2.5"
                >
                  <span>
                    <span className={figure}>{item.grams} g</span> <span className="font-medium">{item.food.label}</span>
                    {item.food.preparation && (
                      <span className="text-secondary"> ({PREPARATION_LABELS[item.food.preparation]})</span>
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
              <span className="text-secondary">Extras: </span>
              {meal.extras}
            </p>
          )}
        </section>
      ))}
    </article>
  );
}
