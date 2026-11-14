import type { Metadata } from "next";
import { Suspense } from "react";
import { PlanEditor } from "@/modules/plans/components/plan-editor";
import { muted, page } from "@/modules/ui/classes";

export const metadata: Metadata = { title: "Meal plan · Nutritio" };

export default function Page({ params, searchParams }: PageProps<"/plans/[planId]">) {
  return (
    <main className={page}>
      <Suspense fallback={<p className={muted}>Loading…</p>}>
        <PlanEditor
          params={params}
          searchParams={searchParams as Promise<{ meal?: string; q?: string }>}
        />
      </Suspense>
    </main>
  );
}
