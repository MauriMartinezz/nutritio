import type { Metadata } from "next";
import { Suspense } from "react";
import { getMessages } from "@/lib/i18n/server";
import { planMessages } from "@/modules/plans/messages";
import { MyShoppingList } from "@/modules/plans/components/shopping-list";
import { page } from "@/modules/ui/classes";
import { ListSkeleton } from "@/modules/ui/components/skeleton";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getMessages(planMessages);
  return { title: `${t.titles.shoppingList} · Nutritio` };
}

export default function Page({ params, searchParams }: PageProps<"/[lang]/my-plans/[planId]/shopping-list">) {
  return (
    <main className={page}>
      <Suspense fallback={<ListSkeleton rows={6} />}>
        <MyShoppingList params={params} searchParams={searchParams as Promise<{ list?: string | string[] }>} />
      </Suspense>
    </main>
  );
}
