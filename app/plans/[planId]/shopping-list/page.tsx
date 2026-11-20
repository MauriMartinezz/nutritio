import type { Metadata } from "next";
import { Suspense } from "react";
import { PlanShoppingList } from "@/modules/plans/components/shopping-list";
import { page } from "@/modules/ui/classes";
import { ListSkeleton } from "@/modules/ui/components/skeleton";

export const metadata: Metadata = { title: "Shopping list · Nutritio" };

export default function Page({ params, searchParams }: PageProps<"/plans/[planId]/shopping-list">) {
  return (
    <main className={page}>
      <Suspense fallback={<ListSkeleton rows={6} />}>
        <PlanShoppingList params={params} searchParams={searchParams as Promise<{ list?: string | string[] }>} />
      </Suspense>
    </main>
  );
}
