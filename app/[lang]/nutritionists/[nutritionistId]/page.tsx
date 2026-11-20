import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getMessages } from "@/lib/i18n/server";
import { coachingMessages } from "@/modules/coaching/messages";
import { link, page } from "@/modules/ui/classes";
import { NutritionistPublicProfile } from "@/modules/coaching/components/nutritionist-public-profile";
import { SectionsSkeleton } from "@/modules/ui/components/skeleton";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getMessages(coachingMessages)).nutritionistMeta };
}

export default async function Page({ params }: PageProps<"/[lang]/nutritionists/[nutritionistId]">) {
  const t = await getMessages(coachingMessages);
  return (
    <main className={page}>
      <Link href="/nutritionists" className={`${link} self-start text-sm`}>
        {t.allNutritionists}
      </Link>
      <Suspense fallback={<SectionsSkeleton sections={2} />}>
        <NutritionistPublicProfile params={params} />
      </Suspense>
    </main>
  );
}
