import { listMyPlans, type PlanView } from "../dal";
import { MacroSummary } from "./macro-summary";

const PREPARATION_LABELS = { RAW: "raw", COOKED: "cooked" } as const;

/** The signed-in client's plans, read-only, grouped by nutritionist. Render inside <Suspense>. */
export async function MyPlans() {
  const plans = await listMyPlans();
  if (plans.length === 0) {
    return <p className="text-sm text-zinc-500">Your nutritionists have not assigned you a plan yet.</p>;
  }

  // Grouped by id: two nutritionists may share a name.
  const byNutritionist = Map.groupBy(plans, (plan) => plan.nutritionist.id);

  return (
    <div className="flex flex-col gap-10">
      {[...byNutritionist].map(([nutritionistId, nutritionistPlans]) => (
        <section key={nutritionistId} className="flex flex-col gap-6">
          <h2 className="text-lg font-semibold">From {nutritionistPlans[0].nutritionist.name}</h2>
          {nutritionistPlans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} />
          ))}
        </section>
      ))}
    </div>
  );
}

function PlanCard({ plan }: { plan: PlanView }) {
  return (
    <article className="flex flex-col gap-4 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <header className="flex flex-col gap-1">
        <h3 className="text-xl font-semibold">{plan.name}</h3>
        <p className="text-xs text-zinc-500">Updated {plan.updatedAt.toLocaleDateString()}</p>
        {plan.notes && <p className="whitespace-pre-line text-sm">{plan.notes}</p>}
        <p>
          Daily total: <MacroSummary totals={plan.totals} strong />
        </p>
      </header>
      {plan.meals.map((meal) => (
        <section key={meal.id} className="flex flex-col gap-2">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h4 className="font-medium">{meal.name}</h4>
            <MacroSummary totals={meal.totals} />
          </div>
          {meal.items.length === 0 ? (
            <p className="text-sm text-zinc-500">Nothing planned.</p>
          ) : (
            <ul className="flex flex-col gap-1 text-sm">
              {meal.items.map((item) => (
                <li key={item.id} className="flex flex-wrap justify-between gap-2">
                  <span>
                    {item.grams} g {item.food.label}
                    {item.food.preparation && (
                      <span className="text-zinc-500"> ({PREPARATION_LABELS[item.food.preparation]})</span>
                    )}
                    {item.note && <span className="text-zinc-500"> — {item.note}</span>}
                  </span>
                  <MacroSummary totals={item.totals} />
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </article>
  );
}
