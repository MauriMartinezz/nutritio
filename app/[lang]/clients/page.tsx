import type { Metadata } from "next";
import { Suspense } from "react";
import { getMessages } from "@/lib/i18n/server";
import { coachingMessages } from "@/modules/coaching/messages";
import { h1, page } from "@/modules/ui/classes";
import { MyClients } from "@/modules/coaching/components/my-clients";
import { PendingActions } from "@/modules/meetings/components/pending-actions-badge";
import { TableSkeleton } from "@/modules/ui/components/skeleton";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getMessages(coachingMessages)).myClientsMeta };
}

export default async function Page({ searchParams }: PageProps<"/[lang]/clients">) {
  const t = await getMessages(coachingMessages);
  return (
    <main className={page}>
      <h1 className={`${h1} flex flex-wrap items-center`}>
        {t.myClientsTitle}
        <Suspense fallback={null}>
          <PendingActions />
        </Suspense>
      </h1>
      <Suspense fallback={<TableSkeleton />}>
        <MyClients searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
