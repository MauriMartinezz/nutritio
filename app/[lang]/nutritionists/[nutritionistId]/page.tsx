import type { Metadata } from "next";
import { Suspense } from "react";
import { getMessages } from "@/lib/i18n/server";
import { coachingMessages } from "@/modules/coaching/messages";
import { page } from "@/modules/ui/classes";
import { NutritionistPublicProfile } from "@/modules/coaching/components/nutritionist-public-profile";
import { SectionsSkeleton } from "@/modules/ui/components/skeleton";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getMessages(coachingMessages)).nutritionistMeta };
}

export default function Page({ params }: PageProps<"/[lang]/nutritionists/[nutritionistId]">) {
  return (
    <main className={page}>
      <Suspense fallback={<SectionsSkeleton sections={2} />}>
        <NutritionistPublicProfile params={params} />
      </Suspense>
    </main>
  );
}
