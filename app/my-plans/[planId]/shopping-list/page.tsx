import type { Metadata } from "next";
import { Suspense } from "react";
import { MyShoppingList } from "@/modules/plans/components/shopping-list";
import { muted, page } from "@/modules/ui/classes";

export const metadata: Metadata = { title: "Shopping list · Nutritio" };

export default function Page({ params, searchParams }: PageProps<"/my-plans/[planId]/shopping-list">) {
  return (
    <main className={page}>
      <Suspense fallback={<p className={muted}>Loading…</p>}>
        <MyShoppingList params={params} searchParams={searchParams as Promise<{ list?: string | string[] }>} />
      </Suspense>
    </main>
  );
}
