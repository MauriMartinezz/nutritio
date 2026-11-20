import type { Metadata } from "next";
import { Suspense } from "react";
import { h1, muted, page } from "@/modules/ui/classes";
import { MyMeetings } from "@/modules/meetings/components/my-meetings";
import { ListSkeleton } from "@/modules/ui/components/skeleton";

export const metadata: Metadata = { title: "Meetings · Nutritio" };

export default function Page() {
  return (
    <main className={page}>
      <div className="flex flex-col gap-2">
        <h1 className={h1}>Meetings</h1>
        <p className={muted}>Ask your nutritionist for a video call or an in-person visit.</p>
      </div>
      <Suspense fallback={<ListSkeleton />}>
        <MyMeetings />
      </Suspense>
    </main>
  );
}
