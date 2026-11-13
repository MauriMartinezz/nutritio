import Link from "next/link";
import { createPlan } from "../actions";
import { listTemplates } from "../dal";

/** The signed-in nutritionist's reusable templates. Render inside <Suspense>. */
export async function TemplateList() {
  const templates = await listTemplates();

  return (
    <div className="flex flex-col gap-4">
      {templates.length === 0 ? (
        <p className="text-sm text-zinc-500">
          No templates yet. A template is a plan without a client that you can copy for any client.
        </p>
      ) : (
        <ul className="flex flex-col gap-1">
          {templates.map((template) => (
            <li key={template.id}>
              <Link href={`/plans/${template.id}`} className="underline">
                {template.name}
              </Link>
            </li>
          ))}
        </ul>
      )}
      <form action={createPlan.bind(null, null)} className="flex gap-2">
        <input
          name="name"
          required
          maxLength={120}
          placeholder="New template name"
          aria-label="New template name"
          className="flex-1 rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        <button className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900">
          Create template
        </button>
      </form>
    </div>
  );
}
