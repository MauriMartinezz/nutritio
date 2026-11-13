import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { NutritionistEditor } from "@/modules/nutritionists/components/nutritionist-editor";

export const metadata: Metadata = { title: "Edit nutritionist · Nutritio" };

export default function Page({ params }: PageProps<"/admin/nutritionists/[id]">) {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-16">
      <Link href="/admin" className="text-sm underline">
        ← Nutritionists
      </Link>
      <h1 className="text-2xl font-semibold">Edit nutritionist</h1>
      <Suspense fallback={<p className="text-sm text-zinc-500">Loading…</p>}>
        <NutritionistEditor params={params} />
      </Suspense>
    </main>
  );
}
