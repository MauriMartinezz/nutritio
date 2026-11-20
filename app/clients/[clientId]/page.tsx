import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { link, page } from "@/modules/ui/classes";
import { ClientActivities } from "@/modules/activities/components/client-activities";
import { ClientCheckIns } from "@/modules/checkins/components/client-check-ins";
import { ClientAccess } from "@/modules/coaching/components/client-access";
import { ClientProfile } from "@/modules/coaching/components/client-profile";
import { ClientPlans } from "@/modules/plans/components/client-plans";
import { SectionsSkeleton } from "@/modules/ui/components/skeleton";

export const metadata: Metadata = { title: "Client · Nutritio" };

export default function Page({ params }: PageProps<"/clients/[clientId]">) {
  return (
    <main className={page}>
      <Link href="/clients" className={`${link} self-start text-sm`}>
        ← Back
      </Link>
      <Suspense fallback={<SectionsSkeleton sections={4} />}>
        <ClientProfile params={params} />
        <ClientAccess params={params} />
        <ClientCheckIns params={params} />
        <ClientActivities params={params} />
        <ClientPlans params={params} />
      </Suspense>
    </main>
  );
}
