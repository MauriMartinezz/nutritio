import type { Metadata } from "next";
import { Suspense } from "react";
import { TemplateList } from "@/modules/plans/components/template-list";
import { h1, muted, page } from "@/modules/ui/classes";

export const metadata: Metadata = { title: "Plan templates · Nutritio" };

export default function Page() {
  return (
    <main className={page}>
      <h1 className={h1}>Plan templates</h1>
      <Suspense fallback={<p className={muted}>Loading…</p>}>
        <TemplateList />
      </Suspense>
    </main>
  );
}
