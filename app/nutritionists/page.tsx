import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { NutritionistDirectory } from "@/modules/coaching/components/nutritionist-directory";

export const metadata: Metadata = { title: "Find a nutritionist · Nutritio" };

export default function Page() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-16">
      <Link href="/" className="text-sm underline">
        ← Back
      </Link>
      <h1 className="text-2xl font-semibold">Find a nutritionist</h1>
      <Suspense fallback={<p className="text-sm text-zinc-500">Loading…</p>}>
        <NutritionistDirectory />
      </Suspense>
    </main>
  );
}
