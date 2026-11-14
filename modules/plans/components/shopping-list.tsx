import Link from "next/link";
import { notFound } from "next/navigation";
import { getMyPlan, getPlanForEditor, type PlanView } from "../dal";
import {
  PlanRuleError,
  SHOPPING_PERIODS,
  formatShoppingGrams,
  parseShoppingPeriod,
  shoppingList,
  type ShoppingPeriod,
} from "../rules";

const PERIOD_LABELS: Record<ShoppingPeriod, string> = {
  weekly: "Weekly",
  biweekly: "Biweekly",
  monthly: "Monthly",
};

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
  const plan = await getMyPlan(planId);
  if (!plan) notFound();
  const period = await readPeriod(searchParams);
  return (
    <ShoppingListView plan={plan} period={period} path={`/my-plans/${plan.id}/shopping-list`} back="/my-plans" />
  );
}

/** The nutritionist's shopping list for a plan they can edit. Render inside <Suspense>. */
export async function PlanShoppingList({ params, searchParams }: Props) {
  const { planId } = await params;
  const plan = await getPlanForEditor(planId);
  if (!plan) notFound();
  const period = await readPeriod(searchParams);
  return (
    <ShoppingListView plan={plan} period={period} path={`/plans/${plan.id}/shopping-list`} back={`/plans/${plan.id}`} />
  );
}

function ShoppingListView({
  plan,
  period,
  path,
  back,
}: {
  plan: PlanView;
  period: ShoppingPeriod;
  path: string;
  back: string;
}) {
  const list = shoppingList(plan.meals, period);
  return (
    <div className="flex flex-col gap-6">
      <Link href={back} className="text-sm underline">
        ← Back to the plan
      </Link>
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Shopping list</h1>
        <p className="text-sm text-zinc-500">
          {plan.name} · {list.days} days, one serving of each meal per day
        </p>
      </header>
      <nav aria-label="Shopping list period" className="flex gap-2">
        {SHOPPING_PERIODS.map((option) => (
          <Link
            key={option}
            href={option === "weekly" ? path : `${path}?list=${option}`}
            aria-current={option === period ? "page" : undefined}
            className={
              option === period
                ? "rounded-md bg-emerald-600 px-3 py-1.5 text-sm text-white"
                : "rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
            }
          >
            {PERIOD_LABELS[option]}
          </Link>
        ))}
      </nav>
      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">{PERIOD_LABELS[period]} quantities</h2>
        {list.items.length === 0 ? (
          <p className="text-sm text-zinc-500">This plan has no foods yet.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-zinc-200 text-sm dark:divide-zinc-800">
            {list.items.map((item) => (
              <li key={item.foodId} className="flex justify-between gap-4 py-1.5">
                <span>{item.label}</span>
                <span className="tabular-nums">{formatShoppingGrams(item.grams)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
      {list.extras.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold">Also buy (extras)</h2>
          <ul className="flex list-disc flex-col gap-1 pl-5 text-sm">
            {list.extras.map((extra) => (
              <li key={extra.text} className="whitespace-pre-line">
                {extra.text} <span className="text-zinc-500">({extra.meals.join(", ")})</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
