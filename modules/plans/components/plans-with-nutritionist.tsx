// On a nutritionist's profile, everything the client has with them: macros, plan and shopping list.
import Link from "next/link";
import { formatNumber } from "@/lib/i18n/format";
import { getLocale, getMessages } from "@/lib/i18n/server";
import { buttonSecondary, callout, card, figure, h2, muted } from "@/modules/ui/classes";
import { getMyWorkWith, type PlanView } from "../dal";
import { macroSplit } from "../rules";
import { withNutritionistMessages } from "../with-nutritionist-messages";
import { PlanCard } from "./my-plans";

type Text = (typeof withNutritionistMessages)["en"];

async function MacroOverview({ plan, t }: { plan: PlanView; t: Text }) {
  const locale = await getLocale();
  const split = macroSplit(plan.totals);
  const grams = (value: number) => `${formatNumber(Math.round(value), locale)} g`;
  const rows = [
    { label: t.protein, grams: plan.totals.proteinG, pct: split?.proteinPct },
    { label: t.carbs, grams: plan.totals.carbsG, pct: split?.carbsPct },
    { label: t.fat, grams: plan.totals.fatG, pct: split?.fatPct },
  ];

  return (
    <section aria-labelledby="macros" className={card}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 id="macros" className="font-semibold">
          {t.macros}
        </h3>
        <p className="text-sm text-secondary">{t.planFrom(plan.name)}</p>
      </div>
      <p className="flex items-baseline gap-2">
        <span className={`${figure} text-4xl`}>{formatNumber(Math.round(plan.totals.kcal), locale)}</span>
        <span className="text-secondary">kcal {t.perDay}</span>
      </p>
      {split && (
        // One bar split by each macro's share of the calories.
        <div aria-hidden className="flex h-2.5 overflow-hidden rounded-full bg-surface-muted">
          <span className="bg-accent" style={{ width: `${split.proteinPct}%` }} />
          <span className="bg-warning" style={{ width: `${split.carbsPct}%` }} />
          <span className="bg-ink/60" style={{ width: `${split.fatPct}%` }} />
        </div>
      )}
      <dl className="grid gap-4 sm:grid-cols-3">
        {rows.map((row, index) => (
          <div key={row.label} className="flex flex-col gap-0.5">
            <dt className="flex items-center gap-2 text-sm text-secondary">
              <span aria-hidden className={`size-2.5 rounded-full ${["bg-accent", "bg-warning", "bg-ink/60"][index]}`} />
              {row.label}
            </dt>
            <dd className={`${figure} text-xl`}>{grams(row.grams)}</dd>
            {row.pct !== undefined && <dd className="text-xs text-secondary">{t.ofCalories(row.pct)}</dd>}
          </div>
        ))}
      </dl>
      {plan.totals.incomplete && <p className="text-xs text-warning">{t.incomplete}</p>}
    </section>
  );
}

/** Nothing unless the signed-in client works (or worked) with this nutritionist. Render inside <Suspense>. */
export async function PlansWithNutritionist({
  nutritionistId,
  nutritionistName,
}: {
  nutritionistId: string;
  nutritionistName: string;
}) {
  const work = await getMyWorkWith(nutritionistId, await getLocale());
  if (!work) return null;
  const t = await getMessages(withNutritionistMessages);
  const accessExpired = work.expired;
  const plans = work.plans;
  const latest = plans[0];

  return (
    <section id="plan" aria-labelledby="with-nutritionist" className="flex scroll-mt-6 flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="with-nutritionist" className={h2}>
          {t.title(nutritionistName)}
        </h2>
        {!accessExpired && (
          <div className="flex flex-wrap gap-2">
            {latest && (
              <Link href={`/my-plans/${latest.id}/shopping-list`} className={buttonSecondary}>
                {t.shoppingList}
              </Link>
            )}
            <Link href="/check-ins" className={buttonSecondary}>
              {t.checkIns}
            </Link>
            <Link href="/meetings" className={buttonSecondary}>
              {t.meetings}
            </Link>
          </div>
        )}
      </div>
      {accessExpired ? (
        <p className={callout("danger")}>{t.expired}</p>
      ) : !latest ? (
        <p className={`${card} ${muted}`}>{t.noPlan}</p>
      ) : (
        <>
          <MacroOverview plan={latest} t={t} />
          {plans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} />
          ))}
        </>
      )}
    </section>
  );
}
