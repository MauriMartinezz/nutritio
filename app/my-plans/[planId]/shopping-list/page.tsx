import type { Metadata } from "next";
import { Suspense } from "react";
import { MyShoppingList } from "@/modules/plans/components/shopping-list";

export const metadata: Metadata = { title: "Shopping list · Nutritio" };

export default function Page({ params, searchParams }: PageProps<"/my-plans/[planId]/shopping-list">) {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-16">
      <Suspense fallback={<p className="text-sm text-zinc-500">Loading…</p>}>
        <MyShoppingList params={params} searchParams={searchParams as Promise<{ list?: string | string[] }>} />
      </Suspense>
    </main>
  );
}
