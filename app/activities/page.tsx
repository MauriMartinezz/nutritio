import type { Metadata } from "next";
import { Suspense } from "react";
import { MyActivities } from "@/modules/activities/components/my-activities";
import { h1, muted, page } from "@/modules/ui/classes";

export const metadata: Metadata = { title: "My activities · Nutritio" };

export default function Page() {
  return (
    <main className={page}>
      <h1 className={h1}>My activities</h1>
      <Suspense fallback={<p className={muted}>Loading…</p>}>
        <MyActivities />
      </Suspense>
    </main>
  );
}
