import Link from "next/link";
import { notFound } from "next/navigation";
import { formatNumber } from "@/lib/i18n/format";
import { getLocale, getMessages } from "@/lib/i18n/server";
import {
  badge,
  buttonDanger,
  buttonPrimary,
  buttonSecondary,
  card,
  cardAccent,
  eyebrow,
  input,
  label,
  link,
  list,
  muted,
  textarea,
} from "@/modules/ui/classes";
import { editPlan } from "../actions";
import { getPlanForEditor, searchFoods } from "../dal";
import { planMessages } from "../messages";
import { MAX_EXTRAS, MAX_GRAMS, MAX_SERVINGS, planField } from "../rules";
import { MacroSummary } from "./macro-summary";
import { MealTotals } from "./meal-totals";
import { EditInput, EditTextarea, IntentButton, PlanEditsForm } from "./plan-edits-form";
import { SortableMeals } from "./sortable-meals";

const preparationBadge = badge("neutral");
const gramsUnit = "font-mono text-sm font-medium text-secondary";

type Props = {
  params: Promise<{ planId: string }>;
  searchParams: Promise<{ meal?: string; q?: string }>;
};

/**
 * Nutritionist-only plan editor: one form saved by a single "Save changes" button at the
 * end. Reads params and the session: render inside <Suspense>.
 */
export async function PlanEditor({ params, searchParams }: Props) {
  const { planId } = await params;
  const locale = await getLocale();
  const t = await getMessages(planMessages);
  const plan = await getPlanForEditor(planId, locale);
  if (!plan) notFound();

  const { meal: searchMealId, q } = await searchParams;
  const query = (q ?? "").trim();
  const results = searchMealId && query ? await searchFoods(query, locale) : [];
  const preparation = { RAW: t.raw, COOKED: t.cooked } as const;

  return (
    <PlanEditsForm action={editPlan.bind(null, plan.id)}>
      <div className="flex flex-col gap-6">
        <header className="flex flex-col gap-4">
          <p className={eyebrow}>
            {plan.client ? (
              <>
                {t.planFor}{" "}
                <Link href={`/clients/${plan.client.id}`} className={link}>
                  {plan.client.name}
                </Link>
              </>
            ) : (
              <>
                {t.templateEyebrow} ·{" "}
                <Link href="/plans" className={link}>
                  {t.allTemplates}
                </Link>
              </>
            )}
          </p>
          <div className={card}>
            <EditInput
              name="name"
              required
              maxLength={120}
              defaultValue={plan.name}
              aria-label={t.planName}
              className={`${input} w-full text-xl font-semibold tracking-tight`}
            />
            <EditTextarea
              name="notes"
              maxLength={2000}
              rows={2}
              defaultValue={plan.notes ?? ""}
              placeholder={t.notesPlaceholder}
              className={`${textarea} w-full`}
            />
          </div>
          <div className={cardAccent}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm font-semibold text-accent">
                {t.dailyTotal} <MacroSummary totals={plan.totals} strong />
              </p>
              <Link href={`/plans/${plan.id}/shopping-list`} className={buttonSecondary}>
                {t.shoppingList}
              </Link>
            </div>
            <p className="text-xs text-secondary">{t.totalsHint}</p>
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
                  <div className="flex min-w-0 flex-1 flex-wrap gap-2">
                    <EditInput
                      name={planField.mealName(meal.id)}
                      required
                      maxLength={60}
                      defaultValue={meal.name}
                      aria-label={t.mealName}
                      className={`${input} min-w-0 flex-1 text-base font-semibold sm:max-w-xs`}
                    />
                  </div>
                  <IntentButton intent={`removeMeal:${meal.id}`} pendingText={t.pending.removing} className={buttonDanger}>
                    {t.removeMeal}
                  </IntentButton>
                </div>
                <MealTotals servings={meal.servings} totals={meal.totals} perServing={meal.perServing} strong />

                <div className="flex flex-col gap-2 rounded-card border border-line p-3 sm:flex-row sm:flex-wrap sm:items-start">
                  <label className="flex items-center gap-2 text-sm font-medium">
                    {t.servings}
                    <EditInput
                      name={planField.mealServings(meal.id)}
                      type="number"
                      required
                      min={1}
                      max={MAX_SERVINGS}
                      step={1}
                      defaultValue={meal.servings}
                      aria-label={t.servingsOf(meal.name)}
                      className={`${input} w-20 font-mono tabular-nums`}
                    />
                  </label>
                  <EditTextarea
                    name={planField.mealExtras(meal.id)}
                    maxLength={MAX_EXTRAS}
                    rows={1}
                    defaultValue={meal.extras ?? ""}
                    placeholder={t.extrasPlaceholder}
                    aria-label={t.extrasOf(meal.name)}
                    className={`${textarea} min-h-11 w-full sm:min-w-48 sm:flex-1`}
                  />
                </div>

                {meal.items.length === 0 ? (
                  <p className={muted}>{t.noFoods}</p>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {meal.items.map((item) => (
                      <li key={item.id} className="flex flex-col gap-3 rounded-card bg-surface-muted p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-semibold">
                            {item.food.label}
                            {item.food.preparation && (
                              <span className={`ml-2 align-middle ${preparationBadge}`}>
                                {preparation[item.food.preparation]}
                                {item.food.preparationNote && ` · ${item.food.preparationNote}`}
                              </span>
                            )}
                          </p>
                          <MacroSummary totals={item.totals} />
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <EditInput
                            name={planField.itemGrams(item.id)}
                            type="number"
                            required
                            min={1}
                            max={MAX_GRAMS}
                            step={1}
                            defaultValue={item.grams}
                            aria-label={t.gramsOf(item.food.label)}
                            className={`${input} w-24 font-mono tabular-nums`}
                          />
                          <span className={gramsUnit}>g</span>
                          <EditInput
                            name={planField.itemNote(item.id)}
                            maxLength={200}
                            defaultValue={item.note ?? ""}
                            placeholder={t.note}
                            aria-label={t.note}
                            className={`${input} min-w-0 flex-1 sm:w-48 sm:flex-none`}
                          />
                          {item.toggle && (
                            <IntentButton intent={`toggle:${item.id}`} pendingText={t.pending.switching} className={buttonSecondary}>
                              {t.switchTo(preparation[item.toggle.preparation])}
                            </IntentButton>
                          )}
                          <IntentButton
                            intent={`removeItem:${item.id}`}
                            pendingText={t.pending.removing}
                            className={buttonDanger}
                            aria-label={t.removeFood(item.food.label)}
                          >
                            {t.remove}
                          </IntentButton>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="flex flex-col gap-2 sm:flex-row">
                  <EditInput
                    name={`search.${meal.id}`}
                    defaultValue={searchMealId === meal.id ? query : ""}
                    placeholder={t.searchPlaceholder}
                    aria-label={t.searchFor(meal.name)}
                    enterIntent={`search:${meal.id}`}
                    className={`${input} w-full sm:flex-1`}
                  />
                  <IntentButton intent={`search:${meal.id}`} pendingText={t.pending.searching} className={buttonSecondary}>
                    {t.search}
                  </IntentButton>
                </div>

                {searchMealId === meal.id &&
                  query &&
                  (results.length === 0 ? (
                    <p className={muted}>{t.noMatches(query)}</p>
                  ) : (
                    <ul className={`${list} rounded-card border border-line`}>
                      {results.map((food) => (
                        <li key={food.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
                          <span className="text-sm">
                            <span className="font-medium">{food.label}</span>
                            {food.preparation && (
                              <span className="text-secondary">
                                {" "}
                                ({preparation[food.preparation]}
                                {food.preparationNote && ` · ${food.preparationNote}`})
                              </span>
                            )}
                            {food.kcal !== null && (
                              <span className="text-secondary">
                                {" "}
                                ·{" "}
                                <span className="font-mono font-medium tabular-nums">
                                  {formatNumber(Math.round(food.kcal), locale)} kcal/100 g
                                </span>
                              </span>
                            )}
                          </span>
                          <span className="flex flex-wrap items-center gap-2">
                            <EditInput
                              name={`add.${food.id}.grams`}
                              type="number"
                              min={1}
                              max={MAX_GRAMS}
                              step={1}
                              defaultValue={100}
                              aria-label={t.gramsOf(food.label)}
                              enterIntent={`addItem:${meal.id}:${food.id}`}
                              className={`${input} w-24 font-mono tabular-nums`}
                            />
                            <span className={gramsUnit}>g</span>
                            <IntentButton
                              intent={`addItem:${meal.id}:${food.id}`}
                              pendingText={t.pending.adding}
                              className={buttonPrimary}
                            >
                              {t.add}
                            </IntentButton>
                          </span>
                        </li>
                      ))}
                    </ul>
                  ))}
              </section>
            ),
          }))}
        />

        <div className={`${card} sm:flex-row sm:flex-wrap sm:items-center`}>
          <label className={`${label} sr-only`} htmlFor="new-meal">
            {t.newMealName}
          </label>
          <EditInput
            id="new-meal"
            name="newMeal"
            maxLength={60}
            placeholder={t.newMealPlaceholder}
            enterIntent="addMeal"
            className={`${input} w-full sm:flex-1`}
          />
          <IntentButton intent="addMeal" pendingText={t.pending.adding} className={buttonSecondary}>
            {t.addMeal}
          </IntentButton>
        </div>

        <div>
          <IntentButton intent="delete" noValidate pendingText={t.pending.deleting} className={buttonDanger}>
            {plan.client ? t.deletePlan : t.deleteTemplate}
          </IntentButton>
        </div>
      </div>
    </PlanEditsForm>
  );
}
