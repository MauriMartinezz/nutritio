import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { MyMeetings } from "@/modules/meetings/components/my-meetings";

export const metadata: Metadata = { title: "Meetings · Nutritio" };

export default function Page() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-16">
      <Link href="/" className="text-sm underline">
        ← Back
      </Link>
      <h1 className="text-2xl font-semibold">Meetings</h1>
      <p className="text-sm text-zinc-500">Ask your nutritionist for a video call or an in-person visit.</p>
      <Suspense fallback={<p className="text-sm text-zinc-500">Loading…</p>}>
        <MyMeetings />
      </Suspense>
    </main>
  );
}
