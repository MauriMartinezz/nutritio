import type { Metadata } from "next";
import { Suspense } from "react";
import { getMessages } from "@/lib/i18n/server";
import { planMessages } from "@/modules/plans/messages";
import { TemplateList } from "@/modules/plans/components/template-list";
import { h1, page } from "@/modules/ui/classes";
import { ListSkeleton } from "@/modules/ui/components/skeleton";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getMessages(planMessages);
  return { title: `${t.titles.templates} · Nutritio` };
}

export default async function Page() {
  const t = await getMessages(planMessages);
  return (
    <main className={page}>
      <h1 className={h1}>{t.titles.templates}</h1>
      <Suspense fallback={<ListSkeleton />}>
        <TemplateList />
      </Suspense>
    </main>
  );
}
