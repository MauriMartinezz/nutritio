import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getMessages } from "@/lib/i18n/server";
import { LOG_ACTIVITY_HREF, MyActivities } from "@/modules/activities/components/my-activities";
import { activityMessages } from "@/modules/activities/messages";
import { buttonPrimary, h1, muted, page } from "@/modules/ui/classes";
import { ListSkeleton } from "@/modules/ui/components/skeleton";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getMessages(activityMessages)).meta };
}

export default async function Page({ searchParams }: PageProps<"/[lang]/activities">) {
  const t = await getMessages(activityMessages);
  return (
    <main className={page}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className={h1}>{t.title}</h1>
          <p className={muted}>{t.lead}</p>
        </div>
        <Link href={LOG_ACTIVITY_HREF} scroll={false} className={buttonPrimary}>
          <span aria-hidden="true" className="text-base leading-none">+</span>
          {t.logActivity}
        </Link>
      </div>
      <Suspense fallback={<ListSkeleton />}>
        <MyActivities searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
