import type { Metadata } from "next";
import { Suspense } from "react";
import { getMessages } from "@/lib/i18n/server";
import { planMessages } from "@/modules/plans/messages";
import { PlanEditor } from "@/modules/plans/components/plan-editor";
import { page } from "@/modules/ui/classes";
import { SectionsSkeleton } from "@/modules/ui/components/skeleton";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getMessages(planMessages);
  return { title: `${t.titles.plan} · Nutritio` };
}

export default function Page({ params, searchParams }: PageProps<"/[lang]/plans/[planId]">) {
  return (
    <main className={page}>
      <Suspense fallback={<SectionsSkeleton fields={3} />}>
        <PlanEditor
          params={params}
          searchParams={searchParams as Promise<{ meal?: string; q?: string }>}
        />
      </Suspense>
    </main>
  );
}
