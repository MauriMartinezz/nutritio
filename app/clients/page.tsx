import type { Metadata } from "next";
import { Suspense } from "react";
import { h1, muted, page } from "@/modules/ui/classes";
import { MyClients } from "@/modules/coaching/components/my-clients";
import { PendingActions } from "@/modules/meetings/components/pending-actions-badge";

export const metadata: Metadata = { title: "My clients · Nutritio" };

export default function Page() {
  return (
    <main className={page}>
      <h1 className={`${h1} flex flex-wrap items-center`}>
        My clients
        <Suspense fallback={null}>
          <PendingActions />
        </Suspense>
      </h1>
      <Suspense fallback={<p className={muted}>Loading…</p>}>
        <MyClients />
      </Suspense>
    </main>
  );
}
