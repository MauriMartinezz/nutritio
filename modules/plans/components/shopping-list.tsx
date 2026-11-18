import Link from "next/link";
import { notFound } from "next/navigation";
import {
  buttonPrimary,
  buttonSecondary,
  card,
  figure,
  h1,
  h2,
  link,
  list as listClass,
  muted,
} from "@/modules/ui/classes";
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
      <header className="flex flex-col gap-2">
        <Link href={back} className={`${link} self-start text-sm`}>
          ← Back to the plan
        </Link>
        <h1 className={h1}>Shopping list</h1>
        <p className={muted}>
          {plan.name} · <span className="font-mono font-medium tabular-nums">{list.days}</span> days, one serving of each
          meal per day
        </p>
      </header>
      <nav aria-label="Shopping list period" className="flex flex-wrap gap-2">
        {SHOPPING_PERIODS.map((option) => (
          <Link
            key={option}
            href={option === "weekly" ? path : `${path}?list=${option}`}
            aria-current={option === period ? "page" : undefined}
            className={option === period ? buttonPrimary : buttonSecondary}
          >
            {PERIOD_LABELS[option]}
          </Link>
        ))}
      </nav>
      <section className={card}>
        <h2 className={h2}>{PERIOD_LABELS[period]} quantities</h2>
        {list.items.length === 0 ? (
          <p className={muted}>This plan has no foods yet.</p>
        ) : (
          <ul className={`${listClass} text-sm`}>
            {list.items.map((item) => (
              <li key={item.foodId} className="flex min-h-11 items-center justify-between gap-4 py-2">
                <span className="font-medium">{item.label}</span>
                <span className={`${figure} shrink-0`}>{formatShoppingGrams(item.grams)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
      {list.extras.length > 0 && (
        <section className={card}>
          <h2 className={h2}>Also buy (extras)</h2>
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
