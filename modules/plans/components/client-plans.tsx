import Link from "next/link";
import { buttonSecondary, card, h2, input, link, list, muted } from "@/modules/ui/classes";
import { createPlan, createPlanFromTemplate } from "../actions";
import { listClientPlans, listTemplates } from "../dal";

const formRow = "flex flex-col gap-2 sm:flex-row sm:items-center";

/** A nutritionist's plans for one accepted client. Render inside <Suspense>. */
export async function ClientPlans({ params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = await params;
  const [plans, templates] = await Promise.all([listClientPlans(clientId), listTemplates()]);

  return (
    <section className={card}>
      <h2 className={h2}>Meal plans</h2>
      {plans.length === 0 ? (
        <p className={muted}>No plans yet.</p>
      ) : (
        <ul className={list}>
          {plans.map((plan) => (
            <li key={plan.id} className="flex min-h-11 flex-wrap items-center gap-x-1 py-2">
              <Link href={`/plans/${plan.id}`} className={link}>
                {plan.name}
              </Link>{" "}
              <span className={muted}>
                · updated <span className="font-mono tabular-nums">{plan.updatedAt.toLocaleDateString()}</span>
              </span>
            </li>
          ))}
        </ul>
      )}

      <form action={createPlan.bind(null, clientId)} className={formRow}>
        <input name="name" required maxLength={120} placeholder="New plan name" aria-label="New plan name" className={`${input} w-full sm:flex-1`} />
        <button className={buttonSecondary}>Create plan</button>
      </form>

      {templates.length > 0 && (
        <form action={createPlanFromTemplate.bind(null, clientId)} className={formRow}>
          <select name="templateId" required aria-label="Template" className={`${input} w-full sm:flex-1`}>
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </select>
          <button className={buttonSecondary}>Use template</button>
        </form>
      )}
    </section>
  );
}
