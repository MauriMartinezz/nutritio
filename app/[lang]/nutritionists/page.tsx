import type { Metadata } from "next";
import { Suspense } from "react";
import { getMessages } from "@/lib/i18n/server";
import { coachingMessages } from "@/modules/coaching/messages";
import { h1, page } from "@/modules/ui/classes";
import { NutritionistDirectory } from "@/modules/coaching/components/nutritionist-directory";
import { CardGridSkeleton } from "@/modules/ui/components/skeleton";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getMessages(coachingMessages)).directoryMeta };
}

export default async function Page() {
  const t = await getMessages(coachingMessages);
  return (
    <main className={page}>
      <h1 className={h1}>{t.directoryTitle}</h1>
      <Suspense fallback={<CardGridSkeleton />}>
        <NutritionistDirectory />
      </Suspense>
    </main>
  );
}
