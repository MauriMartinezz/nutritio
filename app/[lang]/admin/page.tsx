import type { Metadata } from "next";
import { Suspense } from "react";
import { h1, page } from "@/modules/ui/classes";
import { NutritionistList } from "@/modules/nutritionists/components/nutritionist-list";
import { TableSkeleton } from "@/modules/ui/components/skeleton";

export const metadata: Metadata = { title: "Admin · Nutritio" };

export default function AdminPage({ searchParams }: PageProps<"/[lang]/admin">) {
  return (
    <main className={page}>
      <h1 className={h1}>Nutritionists</h1>
      <Suspense fallback={<TableSkeleton />}>
        <NutritionistList searchParams={searchParams as Promise<{ status?: string; q?: string; review?: string }>} />
      </Suspense>
    </main>
  );
}
