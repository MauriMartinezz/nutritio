import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { h1, link, muted, pageNarrow } from "@/modules/ui/classes";
import { NutritionistEditor } from "@/modules/nutritionists/components/nutritionist-editor";

export const metadata: Metadata = { title: "Edit nutritionist · Nutritio" };

export default function Page({ params }: PageProps<"/admin/nutritionists/[id]">) {
  return (
    <main className={pageNarrow}>
      <Link href="/admin" className={`${link} self-start text-sm`}>
        ← Nutritionists
      </Link>
      <h1 className={h1}>Edit nutritionist</h1>
      <Suspense fallback={<p className={muted}>Loading…</p>}>
        <NutritionistEditor params={params} />
      </Suspense>
    </main>
  );
}
