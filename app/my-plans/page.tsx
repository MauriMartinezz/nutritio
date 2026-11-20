import type { Metadata } from "next";
import { Suspense } from "react";
import { MyPlans } from "@/modules/plans/components/my-plans";
import { h1, page } from "@/modules/ui/classes";
import { ListSkeleton } from "@/modules/ui/components/skeleton";

export const metadata: Metadata = { title: "My meal plans · Nutritio" };

export default function Page() {
  return (
    <main className={page}>
      <h1 className={h1}>My meal plans</h1>
      <Suspense fallback={<ListSkeleton />}>
        <MyPlans />
      </Suspense>
    </main>
  );
}
