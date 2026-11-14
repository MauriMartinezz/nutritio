import Link from "next/link";
import { buttonSecondary, card, input, link, list, muted } from "@/modules/ui/classes";
import { createPlan } from "../actions";
import { listTemplates } from "../dal";

/** The signed-in nutritionist's reusable templates. Render inside <Suspense>. */
export async function TemplateList() {
  const templates = await listTemplates();

  return (
    <div className="flex flex-col gap-5">
      <section className={card}>
        {templates.length === 0 ? (
          <p className={muted}>
            No templates yet. A template is a plan without a client that you can copy for any client.
          </p>
        ) : (
          <ul className={list}>
            {templates.map((template) => (
              <li key={template.id} className="flex min-h-11 items-center py-2">
                <Link href={`/plans/${template.id}`} className={link}>
                  {template.name}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
      <form action={createPlan.bind(null, null)} className={`${card} sm:flex-row sm:items-center`}>
        <input
          name="name"
          required
          maxLength={120}
          placeholder="New template name"
          aria-label="New template name"
          className={`${input} w-full sm:flex-1`}
        />
        <button className={buttonSecondary}>Create template</button>
      </form>
    </div>
  );
}
