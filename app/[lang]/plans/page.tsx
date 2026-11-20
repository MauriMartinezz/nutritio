import type { Metadata } from "next";
import { Suspense } from "react";
import { TemplateList } from "@/modules/plans/components/template-list";
import { h1, page } from "@/modules/ui/classes";
import { ListSkeleton } from "@/modules/ui/components/skeleton";

export const metadata: Metadata = { title: "Plan templates · Nutritio" };

export default function Page() {
  return (
    <main className={page}>
      <h1 className={h1}>Plan templates</h1>
      <Suspense fallback={<ListSkeleton />}>
        <TemplateList />
      </Suspense>
    </main>
  );
}
