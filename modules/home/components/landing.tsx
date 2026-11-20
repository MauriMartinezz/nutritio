// Signed-out home page: what Nutritio is, for whom, and how to start.
import Link from "next/link";
import { formatNumber } from "@/lib/i18n/format";
import type { Locale } from "@/lib/i18n/negotiate";
import { getLocale, getMessages } from "@/lib/i18n/server";
import { Brand } from "@/modules/identity/components/app-nav";
import { buttonPrimary, buttonSecondary, figure } from "@/modules/ui/classes";
import { landingMessages } from "../landing-messages";

type Text = (typeof landingMessages)["en"];

const MEALS = [
  { meal: "breakfast", food: "breakfastFood", kcal: 420 },
  { meal: "lunch", food: "lunchFood", kcal: 610 },
  { meal: "snack", food: "snackFood", kcal: 240 },
  { meal: "dinner", food: "dinnerFood", kcal: 530 },
] as const;


/** A day of a real-looking plan with its shopping list: the product, shown instead of described. */
function PlanPreview({ t, locale }: { t: Text; locale: Locale }) {
  const kcal = (value: number) => `${formatNumber(value, locale)} kcal`;
  const total = MEALS.reduce((sum, item) => sum + item.kcal, 0);
  return (
    <figure aria-label={t.previewLabel} className="flex flex-col">
      <div className="rounded-card-lg border border-line bg-surface">
        <div className="flex items-baseline justify-between gap-4 border-b border-line px-5 py-4">
          <p className="text-lg font-semibold tracking-tight">{t.previewDay}</p>
          <p className="text-sm text-secondary">{t.previewPlan}</p>
        </div>
        <ul>
          {MEALS.map((item) => (
            <li key={item.meal} className="flex items-center gap-4 border-b border-divider px-5 py-3.5">
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="text-xs font-medium text-secondary">{t[item.meal]}</span>
                <span className="truncate text-[15px]">{t[item.food]}</span>
              </div>
              <span className={`${figure} text-sm text-secondary`}>{kcal(item.kcal)}</span>
            </li>
          ))}
        </ul>
        <div className="flex items-center justify-between px-5 pt-4 pb-10">
          <span className="text-sm font-semibold">{t.dayTotal}</span>
          <span className={`${figure} text-accent`}>{kcal(total)}</span>
        </div>
      </div>

      {/* Overlaps the plan: the list is generated from it. */}
      <div className="relative -mt-6 ml-6 rounded-card border border-accent/30 bg-accent-tint p-4 sm:ml-auto sm:w-80">
        <p className="mb-2 text-sm font-semibold text-accent">{t.shoppingList}</p>
        <dl className="flex flex-col gap-1.5 text-sm">
          <div>
            <dt className="font-medium">{t.greengrocer}</dt>
            <dd className="text-secondary">{t.greengrocerItems}</dd>
          </div>
          <div>
            <dt className="font-medium">{t.grocery}</dt>
            <dd className="text-secondary">{t.groceryItems}</dd>
          </div>
        </dl>
      </div>
    </figure>
  );
}

function Audience({ title, points }: { title: string; points: readonly string[] }) {
  return (
    <section className="flex flex-col gap-4 border-t-2 border-ink pt-5">
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      <ul className="flex flex-col gap-3">
        {points.map((point) => (
          <li key={point} className="flex gap-3 text-[15px] leading-relaxed text-secondary">
            <span aria-hidden className="mt-2.5 size-1.5 shrink-0 rounded-full bg-accent" />
            {point}
          </li>
        ))}
      </ul>
    </section>
  );
}

export async function Landing() {
  const t = await getMessages(landingMessages);
  const locale = await getLocale();

  return (
    <div className="flex flex-col gap-20 md:gap-28">
      <header className="flex items-center justify-between gap-4">
        <Brand />
        <nav className="flex items-center gap-2">
          <Link href="/sign-in" className={`${buttonSecondary} border-transparent whitespace-nowrap`}>
            {t.signIn}
          </Link>
          {/* The hero buttons already lead to sign-up on small screens. */}
          <span className="hidden sm:contents">
            <Link href="/sign-up" className={buttonPrimary}>
              {t.createAccount}
            </Link>
          </span>
        </nav>
      </header>

      <section className="grid items-center gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
        <div className="flex flex-col gap-6">
          <h1 className="max-w-[16ch] text-4xl leading-[1.08] font-semibold tracking-[-0.03em] text-balance md:text-[56px]">
            {t.title}
          </h1>
          <p className="max-w-[54ch] text-lg leading-relaxed text-secondary">{t.lead}</p>
          <div className="flex flex-wrap gap-3">
            <Link href="/sign-up" className={buttonPrimary}>
              {t.startAsClient}
            </Link>
            <Link href="/sign-up?role=NUTRITIONIST" className={buttonSecondary}>
              {t.startAsNutritionist}
            </Link>
          </div>
        </div>
        <PlanPreview t={t} locale={locale} />
      </section>

      <div className="grid gap-10 md:grid-cols-2 md:gap-12">
        <Audience title={t.forClients} points={t.clientPoints} />
        <Audience title={t.forNutritionists} points={t.nutritionistPoints} />
      </div>

      <section aria-labelledby="how-it-works" className="flex flex-col gap-8">
        <h2 id="how-it-works" className="text-2xl font-semibold tracking-tight md:text-3xl">
          {t.howItWorks}
        </h2>
        <ol className="grid gap-8 md:grid-cols-3">
          {t.steps.map((step, index) => (
            <li key={step.title} className="flex flex-col gap-2">
              <span className={`${figure} text-3xl text-accent`}>{index + 1}</span>
              <h3 className="text-base font-semibold">{step.title}</h3>
              <p className="text-[15px] leading-relaxed text-secondary">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="flex flex-col items-start gap-5 rounded-card-lg bg-accent px-6 py-10 text-on-accent md:flex-row md:items-center md:justify-between md:px-10">
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-semibold tracking-tight">{t.closingTitle}</h2>
          <p className="text-on-accent/80">{t.verifiedNote}</p>
        </div>
        <Link
          href="/sign-up"
          className="inline-flex min-h-12 shrink-0 items-center rounded-control bg-surface px-5 text-sm font-semibold text-ink hover:bg-surface-muted"
        >
          {t.createAccount}
        </Link>
      </section>
    </div>
  );
}
