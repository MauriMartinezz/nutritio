import type { Metadata } from "next";
import { Suspense } from "react";
import { getMessages } from "@/lib/i18n/server";
import { h1, muted, page } from "@/modules/ui/classes";
import { MyMeetings } from "@/modules/meetings/components/my-meetings";
import { meetingMessages } from "@/modules/meetings/messages";
import { ListSkeleton } from "@/modules/ui/components/skeleton";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getMessages(meetingMessages)).meta };
}

export default async function Page() {
  const t = await getMessages(meetingMessages);
  return (
    <main className={page}>
      <div className="flex flex-col gap-2">
        <h1 className={h1}>{t.title}</h1>
        <p className={muted}>{t.lead}</p>
      </div>
      <Suspense fallback={<ListSkeleton />}>
        <MyMeetings />
      </Suspense>
    </main>
  );
}
