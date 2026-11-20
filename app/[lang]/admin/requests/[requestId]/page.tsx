import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getLocale, getMessages } from "@/lib/i18n/server";
import { roleMessages } from "@/modules/identity/nav-messages";
import { ReplyForm } from "@/modules/support/components/reply-form";
import { RequestCard } from "@/modules/support/components/request-card";
import { getSupportRequest } from "@/modules/support/dal";
import { supportMessages } from "@/modules/support/messages";
import { card, link, muted, pageNarrow } from "@/modules/ui/classes";
import { SectionsSkeleton } from "@/modules/ui/components/skeleton";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getMessages(supportMessages)).requestsMeta };
}

async function Request({ params }: { params: Promise<{ requestId: string }> }) {
  const { requestId } = await params;
  const [request, t, roles, locale] = await Promise.all([
    getSupportRequest(requestId),
    getMessages(supportMessages),
    getMessages(roleMessages),
    getLocale(),
  ]);
  if (!request) notFound();

  return (
    <div className={`${card} gap-0 py-1`}>
      <p className={`${muted} pt-4`}>
        {t.from}: <span className="font-semibold text-ink">{request.user.name}</span> ({roles[request.user.role]}) ·{" "}
        {request.user.email} ·{" "}
        <Link href={`/admin/users/${request.user.id}`} className={link}>
          {t.openUser}
        </Link>
      </p>
      <RequestCard request={request} t={t} locale={locale}>
        <ReplyForm requestId={request.id} reply={request.reply} resolved={request.status === "RESOLVED"} />
      </RequestCard>
    </div>
  );
}

export default async function Page({ params }: PageProps<"/[lang]/admin/requests/[requestId]">) {
  const t = await getMessages(supportMessages);
  return (
    <main className={pageNarrow}>
      <Link href="/admin/requests" className={`${link} text-sm`}>
        {t.backToRequests}
      </Link>
      <Suspense fallback={<SectionsSkeleton sections={1} fields={3} />}>
        <Request params={params} />
      </Suspense>
    </main>
  );
}
