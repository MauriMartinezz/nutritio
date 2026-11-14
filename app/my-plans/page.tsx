import type { Metadata } from "next";
import { Suspense } from "react";
import { MyPlans } from "@/modules/plans/components/my-plans";
import { h1, muted, page } from "@/modules/ui/classes";

export const metadata: Metadata = { title: "My meal plans · Nutritio" };

export default function Page() {
  return (
    <main className={page}>
      <h1 className={h1}>My meal plans</h1>
      <Suspense fallback={<p className={muted}>Loading…</p>}>
        <MyPlans />
      </Suspense>
    </main>
  );
}
