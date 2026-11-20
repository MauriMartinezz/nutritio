import type { Metadata } from "next";
import { Suspense } from "react";
import { getMessages } from "@/lib/i18n/server";
import { coachingMessages } from "@/modules/coaching/messages";
import { page } from "@/modules/ui/classes";
import { ClientActivities } from "@/modules/activities/components/client-activities";
import { ClientCheckIns } from "@/modules/checkins/components/client-check-ins";
import { ClientAccess } from "@/modules/coaching/components/client-access";
import { ClientProfile } from "@/modules/coaching/components/client-profile";
import { ClientPlans } from "@/modules/plans/components/client-plans";
import { SectionsSkeleton } from "@/modules/ui/components/skeleton";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getMessages(coachingMessages)).clientMeta };
}

export default function Page({ params, searchParams }: PageProps<"/[lang]/clients/[clientId]">) {
  return (
    <main className={page}>
      <Suspense fallback={<SectionsSkeleton sections={4} />}>
        <ClientProfile params={params} />
        <ClientAccess params={params} searchParams={searchParams} />
        <ClientCheckIns params={params} />
        <ClientActivities params={params} />
        <ClientPlans params={params} />
      </Suspense>
    </main>
  );
}
