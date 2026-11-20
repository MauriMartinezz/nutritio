import Link from "next/link";
import type { Prisma } from "@/generated/prisma/client";
import { formatDateTime } from "@/lib/i18n/format";
import { getLocale, getMessages } from "@/lib/i18n/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/modules/identity/dal";
import { NUTRITIONIST_STATUSES, type NutritionistStatus } from "@/modules/identity/roles";
import {
  badge,
  buttonPrimary,
  buttonSecondary,
  card,
  figure,
  input,
  list,
  muted,
} from "@/modules/ui/classes";
import { ReviewPanel } from "./review-panel";
import { nutritionistMessages, nutritionistStatusLabels } from "../messages";
import { STATUS_TONES } from "./status";

const TABS = ["PENDING", "APPROVED", "REJECTED", "ALL"] as const;

type SearchParams = Promise<{ status?: string; q?: string; review?: string }>;

/** Admin-only list. Reads the session and search params, so render it inside <Suspense>. */
export async function NutritionistList({ searchParams }: { searchParams: SearchParams }) {
  await requireRole("ADMIN");
  const [params, locale, t, statusLabels] = await Promise.all([
    searchParams,
    getLocale(),
    getMessages(nutritionistMessages),
    getMessages(nutritionistStatusLabels),
  ]);

  const status = (NUTRITIONIST_STATUSES as readonly string[]).includes(params.status ?? "")
    ? (params.status as NutritionistStatus)
    : params.status === "ALL"
      ? "ALL"
      : "PENDING";
  const query = (params.q ?? "").trim().slice(0, 100);

  const where: Prisma.UserWhereInput = {
    role: "NUTRITIONIST",
    ...(status !== "ALL" && { nutritionistStatus: status }),
    ...(query && {
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { email: { contains: query, mode: "insensitive" } },
        { dni: { contains: query, mode: "insensitive" } },
        { licenseNumber: { contains: query, mode: "insensitive" } },
      ],
    }),
  };

  const nutritionists = await prisma.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      email: true,
      dni: true,
      licenseNumber: true,
      specialty: true,
      nutritionistStatus: true,
      createdAt: true,
      verificationNote: true,
    },
    orderBy: { createdAt: "asc" },
    take: 200,
  });

  const listQuery = { status, ...(query && { q: query }) };
  const reviewing = typeof params.review === "string" ? params.review : null;

  return (
    <div className="flex flex-col gap-4">
      <nav className="flex flex-wrap gap-2 text-sm font-semibold">
        {TABS.map((tab) => (
          <Link
            key={tab}
            href={{ pathname: "/admin", query: { status: tab, ...(query && { q: query }) } }}
            aria-current={status === tab ? "page" : undefined}
            className={`inline-flex min-h-11 items-center rounded-full px-4 ${
              status === tab
                ? "bg-ink text-bg"
                : "border border-line-strong bg-surface text-ink hover:bg-surface-muted"
            }`}
          >
            {t.tabs[tab]}
          </Link>
        ))}
      </nav>

      <form className="flex flex-col gap-2 sm:flex-row" action="/admin">
        <input type="hidden" name="status" value={status} />
        <input
          name="q"
          defaultValue={query}
          placeholder={t.searchPlaceholder}
          className={`${input} w-full`}
        />
        <button className={buttonSecondary}>{t.search}</button>
      </form>

      {nutritionists.length === 0 ? (
        <p className={`${card} ${muted}`}>{t.noneFound}</p>
      ) : (
        <ul className={`${list} rounded-card-lg border border-line bg-surface px-5 md:px-6`}>
          {nutritionists.map((nutritionist) => {
            const current = nutritionist.nutritionistStatus ?? "PENDING";
            const selected = reviewing === nutritionist.id;
            return (
              <li
                key={nutritionist.id}
                className={`flex flex-wrap items-center justify-between gap-4 py-4 ${selected ? "-mx-5 bg-surface-active px-5 md:-mx-6 md:px-6" : ""}`}
              >
                <div className="flex min-w-0 flex-col gap-0.5">
                  <p className="flex flex-wrap items-center gap-2 font-semibold">
                    {nutritionist.name}
                    <span className={badge(STATUS_TONES[current])}>{statusLabels[current]}</span>
                  </p>
                  <p className={`${muted} break-all`}>{nutritionist.email}</p>
                  <p className={muted}>
                    {t.licenseShort(nutritionist.licenseNumber ?? "—")}
                    {nutritionist.specialty && ` · ${nutritionist.specialty}`} · {t.applied}{" "}
                    <span className={figure}>
                      {formatDateTime(nutritionist.createdAt, locale, { timeStyle: undefined })}
                    </span>
                    {nutritionist.verificationNote && ` · ${t.hasNote}`}
                  </p>
                </div>
                <Link
                  href={{ pathname: "/admin", query: { ...listQuery, review: nutritionist.id } }}
                  scroll={false}
                  aria-current={selected ? "true" : undefined}
                  className={current === "PENDING" ? buttonPrimary : buttonSecondary}
                >
                  {current === "PENDING" ? t.review : t.open}
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {reviewing && <ReviewPanel id={reviewing} closeHref={`/admin?${new URLSearchParams(listQuery)}`} />}
    </div>
  );
}
