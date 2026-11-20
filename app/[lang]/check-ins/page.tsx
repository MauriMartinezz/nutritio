import type { Metadata } from "next";
import { Suspense } from "react";
import { MyCheckIns } from "@/modules/checkins/components/my-check-ins";
import { h1, page } from "@/modules/ui/classes";
import { ListSkeleton } from "@/modules/ui/components/skeleton";

export const metadata: Metadata = { title: "My check-ins · Nutritio" };

export default function Page() {
  return (
    <main className={page}>
      <h1 className={h1}>My check-ins</h1>
      <Suspense fallback={<ListSkeleton />}>
        <MyCheckIns />
      </Suspense>
    </main>
  );
}
