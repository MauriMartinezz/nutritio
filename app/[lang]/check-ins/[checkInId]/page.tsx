import type { Metadata } from "next";
import { Suspense } from "react";
import { getMessages } from "@/lib/i18n/server";
import { CheckInDetail } from "@/modules/checkins/components/check-in-detail";
import { checkInMessages } from "@/modules/checkins/messages";
import { page } from "@/modules/ui/classes";
import { SectionsSkeleton } from "@/modules/ui/components/skeleton";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getMessages(checkInMessages)).detailMeta };
}

export default function Page({ params }: PageProps<"/[lang]/check-ins/[checkInId]">) {
  return (
    <main className={page}>
      <Suspense fallback={<SectionsSkeleton sections={2} fields={4} />}>
        <CheckInDetail params={params} />
      </Suspense>
    </main>
  );
}
