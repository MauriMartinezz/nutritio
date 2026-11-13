import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { NutritionistList } from "@/modules/nutritionists/components/nutritionist-list";

export const metadata: Metadata = { title: "Admin · Nutritio" };

export default function AdminPage({ searchParams }: PageProps<"/admin">) {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-16">
      <Link href="/" className="text-sm underline">
        ← Home
      </Link>
      <h1 className="text-2xl font-semibold">Nutritionists</h1>
      <Suspense fallback={<p className="text-sm text-zinc-500">Loading…</p>}>
        <NutritionistList searchParams={searchParams as Promise<{ status?: string; q?: string }>} />
      </Suspense>
    </main>
  );
}
