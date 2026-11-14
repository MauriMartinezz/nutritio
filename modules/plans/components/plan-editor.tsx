import Link from "next/link";
import { notFound } from "next/navigation";
import {
  addItem,
  addMeal,
  deletePlan,
  removeItem,
  removeMeal,
  renameMeal,
  toggleItemVariant,
  updateItem,
  updatePlanDetails,
} from "../actions";
import { getPlanForEditor, searchFoods } from "../dal";
import { MAX_GRAMS } from "../rules";
import { MacroSummary } from "./macro-summary";
import { SortableMeals } from "./sortable-meals";

const input =
  "rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900";
const button =
  "rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900";
const primary = "rounded-md bg-emerald-600 px-3 py-1.5 text-sm text-white hover:bg-emerald-700";

const PREPARATION_LABELS = { RAW: "raw", COOKED: "cooked" } as const;

type Props = {
  params: Promise<{ planId: string }>;
  searchParams: Promise<{ meal?: string; q?: string }>;
};

/** Nutritionist-only plan editor. Reads params and the session: render inside <Suspense>. */
export async function PlanEditor({ params, searchParams }: Props) {
  const { planId } = await params;
  const plan = await getPlanForEditor(planId);
  if (!plan) notFound();

  const { meal: searchMealId, q } = await searchParams;
  const query = (q ?? "").trim();
  const results = searchMealId && query ? await searchFoods(query) : [];

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-3">
        <p className="text-sm text-zinc-500">
          {plan.client ? (
            <>
              Plan for{" "}
              <Link href={`/clients/${plan.client.id}`} className="underline">
                {plan.client.name}
              </Link>
            </>
          ) : (
            <>
              Template ·{" "}
              <Link href="/plans" className="underline">
                all templates
              </Link>
            </>
          )}
        </p>
        <form action={updatePlanDetails.bind(null, plan.id)} className="flex flex-col gap-2">
          <input name="name" required maxLength={120} defaultValue={plan.name} className={`${input} text-lg font-semibold`} />
          <textarea
            name="notes"
            maxLength={2000}
            rows={2}
            defaultValue={plan.notes ?? ""}
            placeholder="General notes (water, supplements, timing…)"
            className={input}
          />
          <div>
            <button className={button}>Save details</button>
          </div>
        </form>
        <p>
          Daily total: <MacroSummary totals={plan.totals} strong />
        </p>
      </section>

      <SortableMeals
        planId={plan.id}
        meals={plan.meals.map((meal) => ({
          id: meal.id,
          name: meal.name,
          card: (
            <section className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <form action={renameMeal.bind(null, meal.id)} className="flex gap-2">
                  <input name="name" required maxLength={60} defaultValue={meal.name} aria-label="Meal name" className={`${input} font-medium`} />
                  <button className={button}>Rename</button>
                </form>
                <div className="flex gap-1">
                  <form action={removeMeal.bind(null, meal.id)}>
                    <button className={button}>Remove meal</button>
                  </form>
                </div>
              </div>
              <MacroSummary totals={meal.totals} strong />

              {meal.items.length === 0 ? (
                <p className="text-sm text-zinc-500">No foods yet.</p>
              ) : (
                <ul className="flex flex-col divide-y divide-zinc-200 dark:divide-zinc-800">
                  {meal.items.map((item) => (
                    <li key={item.id} className="flex flex-col gap-2 py-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-medium">
                          {item.food.label}
                          {item.food.preparation && (
                            <span className="ml-2 rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                              {PREPARATION_LABELS[item.food.preparation]}
                              {item.food.preparationNote && ` · ${item.food.preparationNote}`}
                            </span>
                          )}
                        </p>
                        <MacroSummary totals={item.totals} />
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <form action={updateItem.bind(null, item.id)} className="flex flex-wrap items-center gap-2">
                          <input
                            name="grams"
                            type="number"
                            required
                            min={1}
                            max={MAX_GRAMS}
                            step={1}
                            defaultValue={item.grams}
                            aria-label="Grams"
                            className={`${input} w-24`}
                          />
                          <span className="text-sm text-zinc-500">g</span>
                          <input name="note" maxLength={200} defaultValue={item.note ?? ""} placeholder="Note" aria-label="Note" className={input} />
                          <button className={button}>Save</button>
                        </form>
                        {item.toggle && (
                          <form action={toggleItemVariant.bind(null, item.id)}>
                            <button className={button}>Switch to {PREPARATION_LABELS[item.toggle.preparation]}</button>
                          </form>
                        )}
                        <form action={removeItem.bind(null, item.id)}>
                          <button className={button} aria-label={`Remove ${item.food.label}`}>
                            Remove
                          </button>
                        </form>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              <form action={`/plans/${plan.id}`} className="flex gap-2">
                <input type="hidden" name="meal" value={meal.id} />
                <input
                  name="q"
                  minLength={2}
                  defaultValue={searchMealId === meal.id ? query : ""}
                  placeholder="Search a food to add (e.g. arroz, pollo)"
                  aria-label={`Search a food for ${meal.name}`}
                  className={`${input} flex-1`}
                />
                <button className={button}>Search</button>
              </form>

              {searchMealId === meal.id && query && (
                results.length === 0 ? (
                  <p className="text-sm text-zinc-500">No foods match “{query}”.</p>
                ) : (
                  <ul className="flex flex-col divide-y divide-zinc-200 rounded-md border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
                    {results.map((food) => (
                      <li key={food.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
                        <span className="text-sm">
                          {food.label}
                          {food.preparation && (
                            <span className="text-zinc-500">
                              {" "}
                              ({PREPARATION_LABELS[food.preparation]}
                              {food.preparationNote && ` · ${food.preparationNote}`})
                            </span>
                          )}
                          {food.kcal !== null && <span className="text-zinc-500"> · {Math.round(food.kcal)} kcal/100 g</span>}
                        </span>
                        <form action={addItem.bind(null, meal.id, food.id)} className="flex items-center gap-2">
                          <input
                            name="grams"
                            type="number"
                            required
                            min={1}
                            max={MAX_GRAMS}
                            step={1}
                            defaultValue={100}
                            aria-label={`Grams of ${food.label}`}
                            className={`${input} w-24`}
                          />
                          <span className="text-sm text-zinc-500">g</span>
                          <button className={primary}>Add</button>
                        </form>
                      </li>
                    ))}
                  </ul>
                )
              )}
            </section>
          ),
        }))}
      />

      <form action={addMeal.bind(null, plan.id)} className="flex gap-2">
        <input name="name" required maxLength={60} placeholder="New meal (e.g. Pre-workout)" aria-label="New meal name" className={`${input} flex-1`} />
        <button className={button}>Add meal</button>
      </form>

      <form action={deletePlan.bind(null, plan.id)}>
        <button className="text-sm text-red-600 underline">Delete this {plan.client ? "plan" : "template"}</button>
      </form>
    </div>
  );
}
