import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { formatDay } from "@/lib/i18n/format";
import { getLocale, getMessages } from "@/lib/i18n/server";
import { roleMessages } from "@/modules/identity/nav-messages";
import { ROLES } from "@/modules/identity/roles";
import { listUsers, parseRoleFilter } from "@/modules/support/dal";
import { supportMessages } from "@/modules/support/messages";
import { badge, buttonSecondary, card, h1, input, list, muted, page } from "@/modules/ui/classes";
import { TableSkeleton } from "@/modules/ui/components/skeleton";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getMessages(supportMessages)).usersMeta };
}

async function Users({ searchParams }: { searchParams: Promise<{ q?: string; role?: string }> }) {
  const params = await searchParams;
  // Clients by default: they are the ones who usually ask for help.
  const role = params.role === undefined ? "CLIENT" : parseRoleFilter(params.role);
  const query = (params.q ?? "").trim().slice(0, 100);
  const [users, t, roles, locale] = await Promise.all([
    listUsers({ query, role }),
    getMessages(supportMessages),
    getMessages(roleMessages),
    getLocale(),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <form action="/admin/users" className="flex flex-col gap-2 sm:flex-row">
        <input name="q" defaultValue={query} placeholder={t.searchUsers} aria-label={t.searchUsers} className={`${input} w-full`} />
        <select name="role" defaultValue={role} aria-label={t.role} className={input}>
          <option value="ALL">{t.anyRole}</option>
          {ROLES.map((value) => (
            <option key={value} value={value}>
              {roles[value]}
            </option>
          ))}
        </select>
        <button className={buttonSecondary}>{t.search}</button>
      </form>

      {users.length === 0 ? (
        <p className={`${card} ${muted}`}>{t.noUsers}</p>
      ) : (
        <ul className={`${list} rounded-card-lg border border-line bg-surface px-5 md:px-6`}>
          {users.map((user) => (
            <li key={user.id}>
              <Link
                href={`/admin/users/${user.id}`}
                className="flex flex-wrap items-center justify-between gap-3 py-4 hover:text-accent"
              >
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="flex flex-wrap items-center gap-2 font-semibold">
                    {user.name}
                    <span className={badge()}>{roles[user.role]}</span>
                  </span>
                  <span className={`${muted} break-all`}>{user.email}</span>
                </span>
                <span className="flex flex-col items-end gap-1 text-xs text-tertiary">
                  {t.joined(formatDay(user.createdAt, locale))}
                  {user._count.supportRequests > 0 && (
                    <span className={badge("warning")}>{t.openRequests(user._count.supportRequests)}</span>
                  )}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default async function Page({ searchParams }: PageProps<"/[lang]/admin/users">) {
  const t = await getMessages(supportMessages);
  return (
    <main className={page}>
      <h1 className={h1}>{t.usersTitle}</h1>
      <Suspense fallback={<TableSkeleton />}>
        <Users searchParams={searchParams as Promise<{ q?: string; role?: string }>} />
      </Suspense>
    </main>
  );
}
