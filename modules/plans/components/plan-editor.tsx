import Link from "next/link";
import { notFound } from "next/navigation";
import {
  badge,
  buttonDanger,
  buttonPrimary,
  buttonSecondary,
  card,
  cardAccent,
  eyebrow,
  input,
  link,
  list,
  muted,
  textarea,
} from "@/modules/ui/classes";
import {
  addItem,
  addMeal,
  deletePlan,
  removeItem,
  removeMeal,
  renameMeal,
  toggleItemVariant,
  updateMealRecipe,
  updateItem,
  updatePlanDetails,
} from "../actions";
import { getPlanForEditor, searchFoods } from "../dal";
import { MAX_EXTRAS, MAX_GRAMS, MAX_SERVINGS } from "../rules";
import { MacroSummary } from "./macro-summary";
import { MealTotals } from "./meal-totals";
import { SortableMeals } from "./sortable-meals";

const preparationBadge = badge("neutral");
const gramsUnit = "font-mono text-sm font-medium text-secondary";

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
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4">
        <p className={eyebrow}>
          {plan.client ? (
            <>
              Plan for{" "}
              <Link href={`/clients/${plan.client.id}`} className={link}>
                {plan.client.name}
              </Link>
            </>
          ) : (
            <>
              Template ·{" "}
              <Link href="/plans" className={link}>
                all templates
              </Link>
            </>
          )}
        </p>
        <form action={updatePlanDetails.bind(null, plan.id)} className={card}>
          <input
            name="name"
            required
            maxLength={120}
            defaultValue={plan.name}
            className={`${input} w-full text-xl font-semibold tracking-tight`}
          />
          <textarea
            name="notes"
            maxLength={2000}
            rows={2}
            defaultValue={plan.notes ?? ""}
            placeholder="General notes (water, supplements, timing…)"
            className={`${textarea} w-full`}
          />
          <div>
            <button className={buttonSecondary}>Save details</button>
          </div>
        </form>
        <div className={cardAccent}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm font-semibold text-accent">
              Daily total: <MacroSummary totals={plan.totals} strong />
            </p>
            <Link href={`/plans/${plan.id}/shopping-list`} className={buttonSecondary}>
              Shopping list
            </Link>
          </div>
          <p className="text-xs text-secondary">
            Item grams are for the whole recipe; the daily total counts one serving of each meal.
          </p>
        </div>
      </header>

      <SortableMeals
        planId={plan.id}
        meals={plan.meals.map((meal) => ({
          id: meal.id,
          name: meal.name,
          card: (
            <section className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <form action={renameMeal.bind(null, meal.id)} className="flex min-w-0 flex-1 flex-wrap gap-2">
                  <input
                    name="name"
                    required
                    maxLength={60}
                    defaultValue={meal.name}
                    aria-label="Meal name"
                    className={`${input} min-w-0 flex-1 text-base font-semibold sm:max-w-xs`}
                  />
                  <button className={buttonSecondary}>Rename</button>
                </form>
                <div className="flex gap-1">
                  <form action={removeMeal.bind(null, meal.id)}>
                    <button className={buttonDanger}>Remove meal</button>
                  </form>
                </div>
              </div>
              <MealTotals servings={meal.servings} totals={meal.totals} perServing={meal.perServing} strong />

              <form
                action={updateMealRecipe.bind(null, meal.id)}
                className="flex flex-col gap-2 rounded-card border border-line p-3 sm:flex-row sm:flex-wrap sm:items-start"
              >
                <label className="flex items-center gap-2 text-sm font-medium">
                  Servings
                  <input
                    name="servings"
                    type="number"
                    required
                    min={1}
                    max={MAX_SERVINGS}
                    step={1}
                    defaultValue={meal.servings}
                    aria-label={`Servings of ${meal.name}`}
                    className={`${input} w-20 font-mono tabular-nums`}
                  />
                </label>
                <textarea
                  name="extras"
                  maxLength={MAX_EXTRAS}
                  rows={1}
                  defaultValue={meal.extras ?? ""}
                  placeholder="Extras (low-calorie vegetables, condiments…)"
                  aria-label={`Extras of ${meal.name}`}
                  className={`${textarea} min-h-11 w-full sm:min-w-48 sm:flex-1`}
                />
                <button className={buttonSecondary}>Save recipe</button>
              </form>

              {meal.items.length === 0 ? (
                <p className={muted}>No foods yet.</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {meal.items.map((item) => (
                    <li key={item.id} className="flex flex-col gap-3 rounded-card bg-surface-muted p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold">
                          {item.food.label}
                          {item.food.preparation && (
                            <span className={`ml-2 align-middle ${preparationBadge}`}>
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
                            className={`${input} w-24 font-mono tabular-nums`}
                          />
                          <span className={gramsUnit}>g</span>
                          <input
                            name="note"
                            maxLength={200}
                            defaultValue={item.note ?? ""}
                            placeholder="Note"
                            aria-label="Note"
                            className={`${input} min-w-0 flex-1 sm:w-48 sm:flex-none`}
                          />
                          <button className={buttonSecondary}>Save</button>
                        </form>
                        {item.toggle && (
                          <form action={toggleItemVariant.bind(null, item.id)}>
                            <button className={buttonSecondary}>Switch to {PREPARATION_LABELS[item.toggle.preparation]}</button>
                          </form>
                        )}
                        <form action={removeItem.bind(null, item.id)}>
                          <button className={buttonDanger} aria-label={`Remove ${item.food.label}`}>
                            Remove
                          </button>
                        </form>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              <form action={`/plans/${plan.id}`} className="flex flex-col gap-2 sm:flex-row">
                <input type="hidden" name="meal" value={meal.id} />
                <input
                  name="q"
                  minLength={2}
                  defaultValue={searchMealId === meal.id ? query : ""}
                  placeholder="Search a food to add (e.g. arroz, pollo)"
                  aria-label={`Search a food for ${meal.name}`}
                  className={`${input} w-full sm:flex-1`}
                />
                <button className={buttonSecondary}>Search</button>
              </form>

              {searchMealId === meal.id && query && (
                results.length === 0 ? (
                  <p className={muted}>No foods match “{query}”.</p>
                ) : (
                  <ul className={`${list} rounded-card border border-line`}>
                    {results.map((food) => (
                      <li key={food.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
                        <span className="text-sm">
                          <span className="font-medium">{food.label}</span>
                          {food.preparation && (
                            <span className="text-secondary">
                              {" "}
                              ({PREPARATION_LABELS[food.preparation]}
                              {food.preparationNote && ` · ${food.preparationNote}`})
                            </span>
                          )}
                          {food.kcal !== null && (
                            <span className="text-secondary">
                              {" "}
                              · <span className="font-mono font-medium tabular-nums">{Math.round(food.kcal)} kcal/100 g</span>
                            </span>
                          )}
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
                            className={`${input} w-24 font-mono tabular-nums`}
                          />
                          <span className={gramsUnit}>g</span>
                          <button className={buttonPrimary}>Add</button>
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

      <form action={addMeal.bind(null, plan.id)} className={`${card} sm:flex-row sm:items-center`}>
        <input
          name="name"
          required
          maxLength={60}
          placeholder="New meal (e.g. Pre-workout)"
          aria-label="New meal name"
          className={`${input} w-full sm:flex-1`}
        />
        <button className={buttonSecondary}>Add meal</button>
      </form>

      <form action={deletePlan.bind(null, plan.id)}>
        <button className={buttonDanger}>Delete this {plan.client ? "plan" : "template"}</button>
      </form>
    </div>
  );
}
