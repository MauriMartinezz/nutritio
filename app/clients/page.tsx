import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { MyClients } from "@/modules/coaching/components/my-clients";
import { PendingActions } from "@/modules/meetings/components/pending-actions-badge";

export const metadata: Metadata = { title: "My clients · Nutritio" };

export default function Page() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-16">
      <Link href="/" className="text-sm underline">
        ← Back
      </Link>
      <h1 className="flex items-center text-2xl font-semibold">
        My clients
        <Suspense fallback={null}>
          <PendingActions />
        </Suspense>
      </h1>
      <Suspense fallback={<p className="text-sm text-zinc-500">Loading…</p>}>
        <MyClients />
      </Suspense>
    </main>
  );
}
