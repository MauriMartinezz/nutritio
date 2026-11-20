import Link from "next/link";
import { notFound } from "next/navigation";
import {
  buttonPrimary,
  buttonSecondary,
  card,
  figure,
  h1,
  h2,
  list as listClass,
  muted,
} from "@/modules/ui/classes";
import type { Locale } from "@/lib/i18n/negotiate";
import { formatNumber } from "@/lib/i18n/format";
import { getLocale, getMessages } from "@/lib/i18n/server";
import { navMessages } from "@/modules/identity/nav-messages";
import { Breadcrumbs, type BreadcrumbItem } from "@/modules/ui/components/breadcrumbs";
import { getMyPlan, getPlanForEditor, type PlanView } from "../dal";
import { planMessages } from "../messages";
import {
  PlanRuleError,
  SHOPPING_PERIODS,
  formatShoppingGrams,
  parseShoppingPeriod,
  shoppingList,
  type ShoppingPeriod,
} from "../rules";

type Props = {
  params: Promise<{ planId: string }>;
  searchParams: Promise<{ list?: string | string[] }>;
};

async function readPeriod(searchParams: Props["searchParams"]): Promise<ShoppingPeriod> {
  try {
    return parseShoppingPeriod((await searchParams).list);
  } catch (error) {
    if (error instanceof PlanRuleError) notFound();
    throw error;
  }
}

/** The client's shopping list for one of their visible plans. Render inside <Suspense>. */
export async function MyShoppingList({ params, searchParams }: Props) {
  const { planId } = await params;
  const locale = await getLocale();
  const plan = await getMyPlan(planId, locale);
  if (!plan) notFound();
  const period = await readPeriod(searchParams);
  return (
    <ShoppingListView
      plan={plan}
      period={period}
      locale={locale}
      path={`/my-plans/${plan.id}/shopping-list`}
      trail={[
        { label: navMessages[locale].myPlans, href: "/my-plans" },
        // The client sees a plan in full on their nutritionist's page.
        { label: plan.name, href: `/nutritionists/${plan.nutritionist.id}#plan` },
      ]}
    />
  );
}

/** The nutritionist's shopping list for a plan they can edit. Render inside <Suspense>. */
export async function PlanShoppingList({ params, searchParams }: Props) {
  const { planId } = await params;
  const locale = await getLocale();
  const plan = await getPlanForEditor(planId, locale);
  if (!plan) notFound();
  const period = await readPeriod(searchParams);
  return (
    <ShoppingListView
      plan={plan}
      period={period}
      locale={locale}
      path={`/plans/${plan.id}/shopping-list`}
      trail={[
        ...(plan.client
          ? [
              { label: navMessages[locale].myClients, href: "/clients" },
              { label: plan.client.name, href: `/clients/${plan.client.id}` },
            ]
          : [{ label: navMessages[locale].planTemplates, href: "/plans" }]),
        { label: plan.name, href: `/plans/${plan.id}` },
      ]}
    />
  );
}

async function ShoppingListView({
  plan,
  period,
  locale,
  path,
  trail,
}: {
  plan: PlanView;
  period: ShoppingPeriod;
  locale: Locale;
  path: string;
  /** Breadcrumb items above the list; the list itself is appended as the current page. */
  trail: BreadcrumbItem[];
}) {
  const t = await getMessages(planMessages);
  const list = shoppingList(plan.meals, period);
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <Breadcrumbs items={[...trail, { label: t.shoppingList }]} />
        <h1 className={h1}>{t.shoppingList}</h1>
        <p className={muted}>
          {plan.name} · <span className="font-mono font-medium tabular-nums">{formatNumber(list.days, locale)}</span>
          {t.listSummary}
        </p>
      </header>
      <nav aria-label={t.listPeriod} className="flex flex-wrap gap-2">
        {SHOPPING_PERIODS.map((option) => (
          <Link
            key={option}
            href={option === "weekly" ? path : `${path}?list=${option}`}
            aria-current={option === period ? "page" : undefined}
            className={option === period ? buttonPrimary : buttonSecondary}
          >
            {t.periods[option]}
          </Link>
        ))}
      </nav>
      <section className={card}>
        <h2 className={h2}>{t.quantities[period]}</h2>
        {list.items.length === 0 ? (
          <p className={muted}>{t.noPlanFoods}</p>
        ) : (
          <ul className={`${listClass} text-sm`}>
            {list.items.map((item) => (
              <li key={item.foodId} className="flex min-h-11 items-center justify-between gap-4 py-2">
                <span className="font-medium">{item.label}</span>
                <span className={`${figure} shrink-0`}>{formatShoppingGrams(item.grams, locale)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
      {list.extras.length > 0 && (
        <section className={card}>
          <h2 className={h2}>{t.alsoBuy}</h2>
          <ul className={`${listClass} text-sm`}>
            {list.extras.map((extra) => (
              <li key={extra.text} className="whitespace-pre-line py-2">
                {extra.text} <span className="text-secondary">({extra.meals.join(", ")})</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
