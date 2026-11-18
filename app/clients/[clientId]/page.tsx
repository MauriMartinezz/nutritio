import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { link, muted, page } from "@/modules/ui/classes";
import { ClientActivities } from "@/modules/activities/components/client-activities";
import { ClientCheckIns } from "@/modules/checkins/components/client-check-ins";
import { ClientAccess } from "@/modules/coaching/components/client-access";
import { ClientProfile } from "@/modules/coaching/components/client-profile";
import { ClientPlans } from "@/modules/plans/components/client-plans";

export const metadata: Metadata = { title: "Client · Nutritio" };

export default function Page({ params }: PageProps<"/clients/[clientId]">) {
  return (
    <main className={page}>
      <Link href="/clients" className={`${link} self-start text-sm`}>
        ← Back
      </Link>
      <Suspense fallback={<p className={muted}>Loading…</p>}>
        <ClientProfile params={params} />
        <ClientAccess params={params} />
        <ClientCheckIns params={params} />
        <ClientActivities params={params} />
        <ClientPlans params={params} />
      </Suspense>
    </main>
  );
}
