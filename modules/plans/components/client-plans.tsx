import Link from "next/link";
import { buttonSecondary, card, h2, input, link, list, muted } from "@/modules/ui/classes";
import { createPlan, createPlanFromTemplate } from "../actions";
import { formatDay } from "@/lib/i18n/format";
import { getLocale, getMessages } from "@/lib/i18n/server";
import { listClientPlans, listTemplates } from "../dal";
import { planMessages } from "../messages";
import { SubmitButton } from "./submit-button";

const formRow = "flex flex-col gap-2 sm:flex-row sm:items-center";

/** A nutritionist's plans for one accepted client. Render inside <Suspense>. */
export async function ClientPlans({ params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = await params;
  const [plans, templates] = await Promise.all([listClientPlans(clientId), listTemplates()]);
  const locale = await getLocale();
  const t = await getMessages(planMessages);

  return (
    <section className={card}>
      <h2 className={h2}>{t.mealPlans}</h2>
      {plans.length === 0 ? (
        <p className={muted}>{t.noPlans}</p>
      ) : (
        <ul className={list}>
          {plans.map((plan) => (
            <li key={plan.id} className="flex min-h-11 flex-wrap items-center gap-x-1 py-2">
              <Link href={`/plans/${plan.id}`} className={link}>
                {plan.name}
              </Link>{" "}
              <span className={muted}>
                · {t.updatedOn} <span className="font-mono tabular-nums">{formatDay(plan.updatedAt, locale)}</span>
              </span>
            </li>
          ))}
        </ul>
      )}

      <form action={createPlan.bind(null, clientId)} className={formRow}>
        <input name="name" required maxLength={120} placeholder={t.newPlanName} aria-label={t.newPlanName} className={`${input} w-full sm:flex-1`} />
        <SubmitButton pendingText={t.pending.creating} className={buttonSecondary}>
          {t.createPlan}
        </SubmitButton>
      </form>

      {templates.length > 0 && (
        <form action={createPlanFromTemplate.bind(null, clientId)} className={formRow}>
          <select name="templateId" required aria-label={t.template} className={`${input} w-full sm:flex-1`}>
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </select>
          <SubmitButton pendingText={t.pending.creating} className={buttonSecondary}>
            {t.useTemplate}
          </SubmitButton>
        </form>
      )}
    </section>
  );
}
