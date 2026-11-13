import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ClientProfile } from "@/modules/coaching/components/client-profile";
import { ClientPlans } from "@/modules/plans/components/client-plans";

export const metadata: Metadata = { title: "Client · Nutritio" };

export default function Page({ params }: PageProps<"/clients/[clientId]">) {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-16">
      <Link href="/clients" className="text-sm underline">
        ← Back
      </Link>
      <Suspense fallback={<p className="text-sm text-zinc-500">Loading…</p>}>
        <ClientProfile params={params} />
        <ClientPlans params={params} />
      </Suspense>
    </main>
  );
}
