import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { formatDateTime } from "@/lib/i18n/format";
import { getLocale, getMessages } from "@/lib/i18n/server";
import { StatusBadge } from "@/modules/support/components/request-card";
import { FilterTabs } from "@/modules/support/components/filter-tabs";
import { listSupportRequests, parseStatusFilter, type SupportStatusFilter } from "@/modules/support/dal";
import { supportMessages } from "@/modules/support/messages";
import { card, h1, list, muted, page } from "@/modules/ui/classes";
import { ListSkeleton } from "@/modules/ui/components/skeleton";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getMessages(supportMessages)).requestsMeta };
}

async function Inbox({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const status: SupportStatusFilter = parseStatusFilter((await searchParams).status);
  const [requests, t, locale] = await Promise.all([listSupportRequests(status), getMessages(supportMessages), getLocale()]);

  return (
    <div className="flex flex-col gap-4">
      <FilterTabs
        current={status}
        base="/admin/requests"
        labels={[
          ["OPEN", t.open],
          ["RESOLVED", t.resolved],
          ["ALL", t.all],
        ]}
      />
      {requests.length === 0 ? (
        <p className={`${card} ${muted}`}>{t.noAdminRequests}</p>
      ) : (
        <ul className={`${list} rounded-card-lg border border-line bg-surface px-5 md:px-6`}>
          {requests.map((request) => (
            <li key={request.id}>
              <Link href={`/admin/requests/${request.id}`} className="flex flex-col gap-1 py-4 hover:text-accent">
                <span className="flex flex-wrap items-center gap-2 font-semibold">
                  {request.title}
                  <StatusBadge status={request.status} t={t} />
                </span>
                <span className={`${muted} line-clamp-1`}>{request.description}</span>
                <span className="text-xs text-tertiary">
                  {request.user.name} · {request.user.email} · {formatDateTime(request.createdAt, locale)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default async function Page({ searchParams }: PageProps<"/[lang]/admin/requests">) {
  const t = await getMessages(supportMessages);
  return (
    <main className={page}>
      <h1 className={h1}>{t.requestsTitle}</h1>
      <Suspense fallback={<ListSkeleton />}>
        <Inbox searchParams={searchParams as Promise<{ status?: string }>} />
      </Suspense>
    </main>
  );
}
