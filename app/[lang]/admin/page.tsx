import type { Metadata } from "next";
import { Suspense } from "react";
import { getMessages } from "@/lib/i18n/server";
import { h1, page } from "@/modules/ui/classes";
import { nutritionistMessages } from "@/modules/nutritionists/messages";
import { NutritionistList } from "@/modules/nutritionists/components/nutritionist-list";
import { TableSkeleton } from "@/modules/ui/components/skeleton";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getMessages(nutritionistMessages)).adminMeta };
}

export default async function AdminPage({ searchParams }: PageProps<"/[lang]/admin">) {
  const t = await getMessages(nutritionistMessages);
  return (
    <main className={page}>
      <h1 className={h1}>{t.adminTitle}</h1>
      <Suspense fallback={<TableSkeleton />}>
        <NutritionistList searchParams={searchParams as Promise<{ status?: string; q?: string; review?: string }>} />
      </Suspense>
    </main>
  );
}
