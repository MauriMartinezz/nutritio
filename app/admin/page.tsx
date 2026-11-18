import type { Metadata } from "next";
import { Suspense } from "react";
import { h1, muted, page } from "@/modules/ui/classes";
import { NutritionistList } from "@/modules/nutritionists/components/nutritionist-list";

export const metadata: Metadata = { title: "Admin · Nutritio" };

export default function AdminPage({ searchParams }: PageProps<"/admin">) {
  return (
    <main className={page}>
      <h1 className={h1}>Nutritionists</h1>
      <Suspense fallback={<p className={muted}>Loading…</p>}>
        <NutritionistList searchParams={searchParams as Promise<{ status?: string; q?: string; review?: string }>} />
      </Suspense>
    </main>
  );
}
