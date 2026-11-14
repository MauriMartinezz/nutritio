import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { MyCheckIns } from "@/modules/checkins/components/my-check-ins";

export const metadata: Metadata = { title: "My check-ins · Nutritio" };

export default function Page() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-16">
      <Link href="/" className="text-sm underline">
        ← Back
      </Link>
      <h1 className="text-2xl font-semibold">My check-ins</h1>
      <Suspense fallback={<p className="text-sm text-zinc-500">Loading…</p>}>
        <MyCheckIns />
      </Suspense>
    </main>
  );
}
