import Link from "next/link";
import { notFound } from "next/navigation";
import type { Locale } from "@/lib/i18n/negotiate";
import { formatNumber } from "@/lib/i18n/format";
import { getLocale, getMessages } from "@/lib/i18n/server";
import { navMessages } from "@/modules/identity/nav-messages";
import { buttonDanger, buttonSecondary, card, eyebrow, h1, input, label } from "@/modules/ui/classes";
import { Breadcrumbs } from "@/modules/ui/components/breadcrumbs";
import { editPlan } from "../actions";
import { getPlanForEditor, type PlanView } from "../dal";
import { planMessages } from "../messages";
import { MAX_EXTRAS, MAX_GRAMS, MAX_SERVINGS, macroSplit, planField, type Totals } from "../rules";
import { FoodSearch } from "./food-search";
import { EditInput, EditTextarea, IntentButton, PlanEditsForm } from "./plan-edits-form";
import { QuickMeals } from "./quick-meals";
import { SortableMeals } from "./sortable-meals";

type Text = (typeof planMessages)["en"];
type Meal = PlanView["meals"][number];
type Item = Meal["items"][number];

/** Macro colors, the same everywhere a split is drawn. */
const MACRO_COLORS = { protein: "bg-accent", carbs: "bg-warning", fat: "bg-ink/50" } as const;

// Food table: name, state, quantity, kcal, P, C, F, remove. Below md each row wraps.
const ROW = "md:grid md:grid-cols-[minmax(8rem,1fr)_auto_6.25rem_repeat(4,2.75rem)_2.25rem] md:items-center md:gap-2";
const NUMBER = "hidden text-right font-mono text-sm tabular-nums md:block";

const fieldGhost =
  "rounded-control border border-transparent bg-transparent px-2 hover:border-line focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25";

function decimals(value: number, locale: Locale) {
  return formatNumber(value, locale, { maximumFractionDigits: 1 });
}

/** One bar split by each macro's share of the calories. */
function MacroBar({ totals, className = "" }: { totals: Totals; className?: string }) {
  const split = macroSplit(totals);
  return (
    <div aria-hidden className={`flex h-1.5 overflow-hidden rounded-full bg-surface-muted ${className}`}>
      {split && (
        <>
          <span className={MACRO_COLORS.protein} style={{ width: `${split.proteinPct}%` }} />
          <span className={MACRO_COLORS.carbs} style={{ width: `${split.carbsPct}%` }} />
          <span className={MACRO_COLORS.fat} style={{ width: `${split.fatPct}%` }} />
        </>
      )}
    </div>
  );
}

function MealMacros({ totals, t, locale }: { totals: Totals; t: Text; locale: Locale }) {
  return (
    <div className="flex flex-col gap-1.5 sm:items-end">
      <p className="font-mono text-sm tabular-nums">
        <span className="font-semibold">{formatNumber(Math.round(totals.kcal), locale)} kcal</span>
        <span className="text-secondary">
          {" "}
          {t.macros.protein} {decimals(totals.proteinG, locale)} · {t.macros.carbs} {decimals(totals.carbsG, locale)} ·{" "}
          {t.macros.fat} {decimals(totals.fatG, locale)}
        </span>
      </p>
      <MacroBar totals={totals} className="w-full sm:w-44" />
    </div>
  );
}

function StateToggle({ item, t }: { item: Item; t: Text }) {
  const current = item.food.preparation;
  if (!current) return <span className="text-sm text-tertiary">{t.noVariant}</span>;
  const labels = { RAW: t.raw, COOKED: t.cooked } as const;
  return (
    <div className="inline-flex rounded-control border border-line p-0.5">
      {(["RAW", "COOKED"] as const).map((preparation) =>
        preparation === current ? (
          <span
            key={preparation}
            aria-current="true"
            className="rounded-[6px] bg-surface-active px-2 py-1.5 text-xs font-semibold capitalize"
          >
            {labels[preparation]}
          </span>
        ) : item.toggle ? (
          <IntentButton
            key={preparation}
            intent={`toggle:${item.id}`}
            pendingText={t.pending.switching}
            className="rounded-[6px] px-2 py-1.5 text-xs font-medium capitalize text-secondary hover:text-ink disabled:opacity-50"
          >
            {labels[preparation]}
          </IntentButton>
        ) : (
          <span key={preparation} className="px-2 py-1.5 text-xs capitalize text-tertiary">
            {labels[preparation]}
          </span>
        ),
      )}
    </div>
  );
}

function FoodRow({ item, t, locale }: { item: Item; t: Text; locale: Locale }) {
  return (
    <li className={`flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-divider py-2.5 ${ROW}`}>
      <div className="flex min-w-0 basis-full flex-col md:basis-auto">
        <p className="truncate font-semibold">
          {item.food.label}
          {item.food.preparationNote && (
            <span className="font-normal text-secondary"> · {item.food.preparationNote}</span>
          )}
        </p>
        <EditInput
          name={planField.itemNote(item.id)}
          maxLength={200}
          defaultValue={item.note ?? ""}
          placeholder={`+ ${t.addNote}`}
          aria-label={`${t.note}: ${item.food.label}`}
          className="-mx-1 w-full rounded px-1 text-xs text-secondary placeholder:text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/25"
        />
      </div>
      <StateToggle item={item} t={t} />
      <div className="flex flex-wrap items-center gap-1.5">
        <EditInput
          name={planField.itemGrams(item.id)}
          type="number"
          required
          min={1}
          max={MAX_GRAMS}
          step={1}
          defaultValue={item.grams}
          aria-label={t.gramsOf(item.food.label)}
          className={`${input} w-[4.5rem] px-2 text-right font-mono tabular-nums`}
        />
        <span className="font-mono text-sm text-secondary">g</span>
      </div>
      <span className={`${NUMBER} font-semibold`}>{formatNumber(Math.round(item.totals.kcal), locale)}</span>
      <span className={NUMBER}>{decimals(item.totals.proteinG, locale)}</span>
      <span className={NUMBER}>{decimals(item.totals.carbsG, locale)}</span>
      <span className={NUMBER}>{decimals(item.totals.fatG, locale)}</span>
      <IntentButton
        intent={`removeItem:${item.id}`}
        pendingText={t.pending.removing}
        aria-label={t.removeFood(item.food.label)}
        className="ml-auto flex size-9 items-center justify-center rounded-control text-lg text-tertiary hover:bg-danger-bg hover:text-danger disabled:opacity-50 md:ml-0"
      >
        ×
      </IntentButton>
      {/* Below md the four number columns are hidden: one line instead. */}
      <p className="basis-full font-mono text-xs text-secondary tabular-nums md:hidden">
        {formatNumber(Math.round(item.totals.kcal), locale)} kcal · {t.macros.protein}{" "}
        {decimals(item.totals.proteinG, locale)} · {t.macros.carbs} {decimals(item.totals.carbsG, locale)} ·{" "}
        {t.macros.fat} {decimals(item.totals.fatG, locale)}
      </p>
    </li>
  );
}

function MealCard({ meal, t, locale }: { meal: Meal; t: Text; locale: Locale }) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <label className="flex flex-col text-xs font-medium text-secondary">
            {t.mealName}
            <EditInput
              name={planField.mealName(meal.id)}
              required
              maxLength={60}
              defaultValue={meal.name}
              className={`${fieldGhost} -mx-2 min-h-10 w-full max-w-sm text-lg font-semibold tracking-tight text-ink`}
            />
          </label>
          <p className="text-xs text-secondary">
            {meal.servings > 1 ? t.recipeCaption(meal.servings) : t.perServingCaption}
          </p>
        </div>
        <MealMacros totals={meal.perServing} t={t} locale={locale} />
        <IntentButton
          intent={`removeMeal:${meal.id}`}
          pendingText={t.pending.removing}
          className={`${buttonDanger} min-h-9 px-3 text-xs`}
        >
          {t.removeMeal}
        </IntentButton>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className={`${label} shrink-0`}>
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
            className={`${input} w-16 text-right font-mono tabular-nums`}
          />
        </label>
        <label className={`${label} sm:flex-1`}>
          {t.extrasLabel}
          <EditTextarea
            name={planField.mealExtras(meal.id)}
            maxLength={MAX_EXTRAS}
            rows={1}
            defaultValue={meal.extras ?? ""}
            placeholder={t.extrasPlaceholder}
            className={`${input} min-h-10 w-full resize-y py-2 text-sm font-normal`}
          />
        </label>
      </div>

      <div>
        <div className={`hidden text-xs font-medium text-secondary ${ROW} md:pb-2`}>
          <span>{t.columns.food}</span>
          <span>{t.columns.state}</span>
          <span>{t.columns.quantity}</span>
          <span className="text-right">{t.columns.kcal}</span>
          <span className="text-right">{t.columns.protein}</span>
          <span className="text-right">{t.columns.carbs}</span>
          <span className="text-right">{t.columns.fat}</span>
          <span />
        </div>
        {meal.items.length === 0 ? (
          <p className="border-t border-divider py-3 text-sm text-secondary">{t.noFoods}</p>
        ) : (
          <ul>
            {meal.items.map((item) => (
              <FoodRow key={item.id} item={item} t={t} locale={locale} />
            ))}
          </ul>
        )}
      </div>

      <FoodSearch mealId={meal.id} mealName={meal.name} />
    </section>
  );
}

function DayTotal({ plan, t, locale }: { plan: PlanView; t: Text; locale: Locale }) {
  const { totals } = plan;
  const split = macroSplit(totals);
  const macros = [
    { key: "protein", label: t.proteinLong, grams: totals.proteinG, pct: split?.proteinPct },
    { key: "carbs", label: t.carbsLong, grams: totals.carbsG, pct: split?.carbsPct },
    { key: "fat", label: t.fatLong, grams: totals.fatG, pct: split?.fatPct },
  ] as const;
  const dayKcal = totals.kcal;

  return (
    <section aria-labelledby="day-total" className={card}>
      <h2 id="day-total" className="text-sm font-semibold text-accent">
        {t.dayTotalTitle}
      </h2>
      <p className="flex items-baseline gap-2">
        <span className="font-mono text-4xl font-semibold leading-none tabular-nums">
          {formatNumber(Math.round(dayKcal), locale)}
        </span>
        <span className="text-sm text-secondary">{t.kcalPerDay}</span>
      </p>
      <dl className="flex flex-col gap-3">
        {macros.map((macro) => (
          <div key={macro.key} className="flex flex-col gap-1">
            <div className="flex items-baseline justify-between gap-2 text-sm">
              <dt>{macro.label}</dt>
              <dd className="font-mono font-semibold tabular-nums">{decimals(macro.grams, locale)} g</dd>
            </div>
            <dd aria-hidden className="h-1.5 overflow-hidden rounded-full bg-surface-muted">
              <span className={`block h-full ${MACRO_COLORS[macro.key]}`} style={{ width: `${macro.pct ?? 0}%` }} />
            </dd>
            {macro.pct !== undefined && <dd className="text-xs text-secondary">{t.shareOfKcal(macro.pct)}</dd>}
          </div>
        ))}
      </dl>
      {totals.incomplete && <p className="text-xs text-warning">{t.incompleteTitle}</p>}

      {plan.meals.length > 0 && (
        <div className="flex flex-col gap-2 border-t border-divider pt-4">
          <h3 className="text-xs font-medium text-secondary">{t.byMeal}</h3>
          <ul className="flex flex-col gap-1.5 text-sm">
            {plan.meals.map((meal) => (
              <li key={meal.id} className="flex items-baseline justify-between gap-2">
                <span className="truncate">{meal.name}</span>
                <span className="shrink-0 font-mono text-xs tabular-nums text-secondary">
                  {formatNumber(Math.round(meal.perServing.kcal), locale)} kcal
                  {dayKcal > 0 && ` · ${Math.round((meal.perServing.kcal / dayKcal) * 100)} %`}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <p className="text-xs text-secondary">{t.totalsHint}</p>
    </section>
  );
}

type Props = { params: Promise<{ planId: string }> };

/**
 * Nutritionist-only plan editor: one form saved by a single "Save changes" button at the
 * end; foods are searched and added without leaving the page. Render inside <Suspense>.
 */
export async function PlanEditor({ params }: Props) {
  const { planId } = await params;
  const locale = await getLocale();
  const [t, nav] = await Promise.all([getMessages(planMessages), getMessages(navMessages)]);
  const plan = await getPlanForEditor(planId, locale);
  if (!plan) notFound();
  const trail = plan.client
    ? [
        { label: nav.myClients, href: "/clients" },
        { label: plan.client.name, href: `/clients/${plan.client.id}` },
        { label: plan.name },
      ]
    : [{ label: nav.planTemplates, href: "/plans" }, { label: plan.name }];

  return (
    <PlanEditsForm action={editPlan.bind(null, plan.id)}>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
        <div className="flex min-w-0 flex-col gap-5">
          <header className="flex flex-col gap-4">
            <Breadcrumbs items={trail} />
            <div className="flex flex-col gap-1">
              <h1 className={h1}>{plan.client ? t.editorTitle(plan.client.name) : t.templateTitle}</h1>
              {!plan.client && <p className={eyebrow}>{t.templateSubtitle}</p>}
            </div>
            <div className={card}>
              <label className={label}>
                {t.planName}
                <EditInput
                  name="name"
                  required
                  maxLength={120}
                  defaultValue={plan.name}
                  className={`${input} w-full text-lg font-semibold`}
                />
              </label>
              <label className={label}>
                {t.notesLabel}
                <EditTextarea
                  name="notes"
                  maxLength={2000}
                  rows={2}
                  defaultValue={plan.notes ?? ""}
                  placeholder={t.notesPlaceholder}
                  className={`${input} w-full resize-y py-2 text-sm font-normal`}
                />
              </label>
            </div>
          </header>

          <SortableMeals
            planId={plan.id}
            meals={plan.meals.map((meal) => ({
              id: meal.id,
              name: meal.name,
              card: <MealCard meal={meal} t={t} locale={locale} />,
            }))}
          />

          <div className="flex flex-col gap-3 rounded-card-lg border border-dashed border-line-strong p-4">
            <div className="flex flex-col gap-2 sm:flex-row">
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
                + {t.addMeal}
              </IntentButton>
            </div>
            <QuickMeals inputId="new-meal" existing={plan.meals.map((meal) => meal.name)} />
          </div>

          <div>
            <IntentButton intent="delete" noValidate pendingText={t.pending.deleting} className={buttonDanger}>
              {plan.client ? t.deletePlan : t.deleteTemplate}
            </IntentButton>
          </div>
        </div>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-6">
          <DayTotal plan={plan} t={t} locale={locale} />
          <nav className={`${card} gap-1 p-2 md:p-2`}>
            <Link
              href={`/plans/${plan.id}/shopping-list`}
              className="flex min-h-11 items-center rounded-control px-3 text-sm font-medium hover:bg-surface-muted"
            >
              {t.shoppingList}
            </Link>
          </nav>
        </aside>
      </div>
    </PlanEditsForm>
  );
}
