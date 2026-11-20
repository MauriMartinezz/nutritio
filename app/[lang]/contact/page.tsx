import type { Metadata } from "next";
import { Suspense } from "react";
import { getLocale, getMessages } from "@/lib/i18n/server";
import { ContactForm } from "@/modules/support/components/contact-form";
import { RequestCard } from "@/modules/support/components/request-card";
import { getOwnSupportRequests } from "@/modules/support/dal";
import { supportMessages } from "@/modules/support/messages";
import { card, h1, h2, list, muted, pageNarrow } from "@/modules/ui/classes";
import { ListSkeleton } from "@/modules/ui/components/skeleton";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getMessages(supportMessages)).contactMeta };
}

/** Reads the session, so it renders inside <Suspense>. */
async function MyRequests() {
  const [requests, t, locale] = await Promise.all([
    getOwnSupportRequests(),
    getMessages(supportMessages),
    getLocale(),
  ]);
  if (requests.length === 0) return <p className={`${card} ${muted}`}>{t.noRequests}</p>;
  return (
    <div className={`${list} rounded-card-lg border border-line bg-surface px-5 md:px-6`}>
      {requests.map((request) => (
        <RequestCard key={request.id} request={request} t={t} locale={locale} />
      ))}
    </div>
  );
}

export default async function Page() {
  const t = await getMessages(supportMessages);
  return (
    <main className={pageNarrow}>
      <div className="flex flex-col gap-2">
        <h1 className={h1}>{t.contactTitle}</h1>
        <p className={muted}>{t.contactLead}</p>
      </div>
      <ContactForm />
      <section aria-labelledby="my-requests" className="flex flex-col gap-3">
        <h2 id="my-requests" className={h2}>
          {t.myRequests}
        </h2>
        <Suspense fallback={<ListSkeleton rows={2} />}>
          <MyRequests />
        </Suspense>
      </section>
    </main>
  );
}
