import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { link, muted, page } from "@/modules/ui/classes";
import { NutritionistPublicProfile } from "@/modules/coaching/components/nutritionist-public-profile";

export const metadata: Metadata = { title: "Nutritionist · Nutritio" };

export default function Page({ params }: PageProps<"/nutritionists/[nutritionistId]">) {
  return (
    <main className={page}>
      <Link href="/nutritionists" className={`${link} self-start text-sm`}>
        ← All nutritionists
      </Link>
      <Suspense fallback={<p className={muted}>Loading…</p>}>
        <NutritionistPublicProfile params={params} />
      </Suspense>
    </main>
  );
}
