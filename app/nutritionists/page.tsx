import type { Metadata } from "next";
import { Suspense } from "react";
import { h1, muted, page } from "@/modules/ui/classes";
import { NutritionistDirectory } from "@/modules/coaching/components/nutritionist-directory";

export const metadata: Metadata = { title: "Find a nutritionist · Nutritio" };

export default function Page() {
  return (
    <main className={page}>
      <h1 className={h1}>Find a nutritionist</h1>
      <Suspense fallback={<p className={muted}>Loading…</p>}>
        <NutritionistDirectory />
      </Suspense>
    </main>
  );
}
