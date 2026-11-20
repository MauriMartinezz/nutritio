import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getMessages } from "@/lib/i18n/server";
import { coachingMessages } from "@/modules/coaching/messages";
import { link, page } from "@/modules/ui/classes";
import { ClientActivities } from "@/modules/activities/components/client-activities";
import { ClientCheckIns } from "@/modules/checkins/components/client-check-ins";
import { ClientAccess } from "@/modules/coaching/components/client-access";
import { ClientProfile } from "@/modules/coaching/components/client-profile";
import { ClientPlans } from "@/modules/plans/components/client-plans";
import { SectionsSkeleton } from "@/modules/ui/components/skeleton";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getMessages(coachingMessages)).clientMeta };
}

export default async function Page({ params, searchParams }: PageProps<"/[lang]/clients/[clientId]">) {
  const t = await getMessages(coachingMessages);
  return (
    <main className={page}>
      <Link href="/clients" className={`${link} self-start text-sm`}>
        {t.back}
      </Link>
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
