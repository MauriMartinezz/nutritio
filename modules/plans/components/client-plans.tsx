import Link from "next/link";
import { createPlan, createPlanFromTemplate } from "../actions";
import { listClientPlans, listTemplates } from "../dal";

const input =
  "rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900";
const button =
  "rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900";

/** A nutritionist's plans for one accepted client. Render inside <Suspense>. */
export async function ClientPlans({ params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = await params;
  const [plans, templates] = await Promise.all([listClientPlans(clientId), listTemplates()]);

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold">Meal plans</h2>
      {plans.length === 0 ? (
        <p className="text-sm text-zinc-500">No plans yet.</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {plans.map((plan) => (
            <li key={plan.id}>
              <Link href={`/plans/${plan.id}`} className="underline">
                {plan.name}
              </Link>{" "}
              <span className="text-sm text-zinc-500">· updated {plan.updatedAt.toLocaleDateString()}</span>
            </li>
          ))}
        </ul>
      )}

      <form action={createPlan.bind(null, clientId)} className="flex gap-2">
        <input name="name" required maxLength={120} placeholder="New plan name" aria-label="New plan name" className={`${input} flex-1`} />
        <button className={button}>Create plan</button>
      </form>

      {templates.length > 0 && (
        <form action={createPlanFromTemplate.bind(null, clientId)} className="flex gap-2">
          <select name="templateId" required aria-label="Template" className={`${input} flex-1`}>
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </select>
          <button className={button}>Use template</button>
        </form>
      )}
    </section>
  );
}
