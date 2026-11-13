import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PendingNutritionists } from "@/modules/nutritionists/components/pending-nutritionists";

export const metadata: Metadata = { title: "Admin · Nutritio" };

export default function AdminPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-16">
      <Link href="/" className="text-sm underline">
        ← Home
      </Link>
      <h1 className="text-2xl font-semibold">Nutritionist verification</h1>
      <Suspense fallback={<p className="text-sm text-zinc-500">Loading…</p>}>
        <PendingNutritionists />
      </Suspense>
    </main>
  );
}
