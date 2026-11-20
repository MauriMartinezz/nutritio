import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { formatDay } from "@/lib/i18n/format";
import { getLocale, getMessages } from "@/lib/i18n/server";
import { navMessages, roleMessages } from "@/modules/identity/nav-messages";
import { AdminUserForm } from "@/modules/support/components/admin-user-form";
import { RequestCard } from "@/modules/support/components/request-card";
import { getUserForAdmin } from "@/modules/support/dal";
import { supportMessages } from "@/modules/support/messages";
import { badge, card, h1, h2, link, list, muted, pageNarrow } from "@/modules/ui/classes";
import { Breadcrumbs } from "@/modules/ui/components/breadcrumbs";
import { SectionsSkeleton } from "@/modules/ui/components/skeleton";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getMessages(supportMessages)).usersMeta };
}

async function UserProfile({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  const [user, t, roles, nav, locale] = await Promise.all([
    getUserForAdmin(userId),
    getMessages(supportMessages),
    getMessages(roleMessages),
    getMessages(navMessages),
    getLocale(),
  ]);
  if (!user) notFound();

  return (
    <>
      <Breadcrumbs items={[{ label: nav.users, href: "/admin/users" }, { label: user.name }]} />
      <div className="flex flex-col gap-2">
        <h1 className={`${h1} flex flex-wrap items-center gap-3`}>
          {user.name}
          <span className={badge()}>{roles[user.role]}</span>
        </h1>
        <p className={muted}>{t.joined(formatDay(user.createdAt, locale))}</p>
      </div>

      <section aria-labelledby="account" className="flex flex-col gap-3">
        <h2 id="account" className={h2}>
          {t.userData}
        </h2>
        <AdminUserForm user={user} />
      </section>

      <section aria-labelledby="history" className="flex flex-col gap-3">
        <h2 id="history" className={h2}>
          {t.history}
        </h2>
        {user.supportRequests.length === 0 ? (
          <p className={`${card} ${muted}`}>{t.noHistory}</p>
        ) : (
          <div className={`${list} rounded-card-lg border border-line bg-surface px-5 md:px-6`}>
            {user.supportRequests.map((request) => (
              <RequestCard key={request.id} request={request} t={t} locale={locale}>
                <Link href={`/admin/requests/${request.id}`} className={`${link} text-sm`}>
                  {t.reply}
                </Link>
              </RequestCard>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

export default function Page({ params }: PageProps<"/[lang]/admin/users/[userId]">) {
  return (
    <main className={pageNarrow}>
      <Suspense fallback={<SectionsSkeleton sections={2} />}>
        <UserProfile params={params} />
      </Suspense>
    </main>
  );
}
