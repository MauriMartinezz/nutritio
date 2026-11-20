import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { link, page } from "@/modules/ui/classes";
import { NutritionistPublicProfile } from "@/modules/coaching/components/nutritionist-public-profile";
import { SectionsSkeleton } from "@/modules/ui/components/skeleton";

export const metadata: Metadata = { title: "Nutritionist · Nutritio" };

export default function Page({ params }: PageProps<"/[lang]/nutritionists/[nutritionistId]">) {
  return (
    <main className={page}>
      <Link href="/nutritionists" className={`${link} self-start text-sm`}>
        ← All nutritionists
      </Link>
      <Suspense fallback={<SectionsSkeleton sections={2} />}>
        <NutritionistPublicProfile params={params} />
      </Suspense>
    </main>
  );
}
