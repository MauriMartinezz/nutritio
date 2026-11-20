import Link from "next/link";
import { buttonSecondary, card, input, link, list, muted } from "@/modules/ui/classes";
import { createPlan } from "../actions";
import { getMessages } from "@/lib/i18n/server";
import { listTemplates } from "../dal";
import { planMessages } from "../messages";
import { SubmitButton } from "./submit-button";

/** The signed-in nutritionist's reusable templates. Render inside <Suspense>. */
export async function TemplateList() {
  const templates = await listTemplates();
  const t = await getMessages(planMessages);

  return (
    <div className="flex flex-col gap-5">
      <section className={card}>
        {templates.length === 0 ? (
          <p className={muted}>{t.noTemplates}</p>
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
          placeholder={t.newTemplateName}
          aria-label={t.newTemplateName}
          className={`${input} w-full sm:flex-1`}
        />
        <SubmitButton pendingText={t.pending.creating} className={buttonSecondary}>
          {t.createTemplate}
        </SubmitButton>
      </form>
    </div>
  );
}
