import type { Metadata } from "next";
import { Suspense } from "react";
import { PlanEditor } from "@/modules/plans/components/plan-editor";

export const metadata: Metadata = { title: "Meal plan · Nutritio" };

export default function Page({ params, searchParams }: PageProps<"/plans/[planId]">) {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-16">
      <Suspense fallback={<p className="text-sm text-zinc-500">Loading…</p>}>
        <PlanEditor
          params={params}
          searchParams={searchParams as Promise<{ meal?: string; q?: string }>}
        />
      </Suspense>
    </main>
  );
}
