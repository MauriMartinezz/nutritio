import type { Metadata } from "next";
import { Suspense } from "react";
import { getMessages } from "@/lib/i18n/server";
import { MyCheckIns } from "@/modules/checkins/components/my-check-ins";
import { checkInMessages } from "@/modules/checkins/messages";
import { h1, page } from "@/modules/ui/classes";
import { ListSkeleton } from "@/modules/ui/components/skeleton";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getMessages(checkInMessages)).pageMeta };
}

export default async function Page({ searchParams }: PageProps<"/[lang]/check-ins">) {
  const t = await getMessages(checkInMessages);
  return (
    <main className={page}>
      <h1 className={h1}>{t.pageTitle}</h1>
      <Suspense fallback={<ListSkeleton />}>
        <MyCheckIns searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
