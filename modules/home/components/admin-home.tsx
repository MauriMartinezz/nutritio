import Link from "next/link";
import { connection } from "next/server";
import { getLocale, getMessages } from "@/lib/i18n/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/modules/identity/dal";
import { roleMessages } from "@/modules/identity/nav-messages";
import { STATUS_TONES } from "@/modules/nutritionists/components/status";
import { nutritionistStatusLabels } from "@/modules/nutritionists/messages";
import { badge, buttonLink, card, list, muted } from "@/modules/ui/classes";
import { relativeTime } from "../dashboard";
import { homeMessages } from "../messages";
import { DashboardHeader, Kpi, KpiRow, PanelHeader, panelRow } from "./dashboard-parts";

const QUEUE_SIZE = 5;

/** Admin dashboard for the home page. Reads the session: render inside <Suspense>. */
export async function AdminHome() {
  const user = await getCurrentUser();
  if (user?.role !== "ADMIN") return null;

  const [pending, approved, clients, activeLinks, queue, signUps] = await Promise.all([
    prisma.user.count({ where: { role: "NUTRITIONIST", nutritionistStatus: "PENDING" } }),
    prisma.user.count({ where: { role: "NUTRITIONIST", nutritionistStatus: "APPROVED" } }),
    prisma.user.count({ where: { role: "CLIENT" } }),
    prisma.nutritionistClient.count({ where: { status: "ACCEPTED" } }),
    prisma.user.findMany({
      where: { role: "NUTRITIONIST", nutritionistStatus: "PENDING" },
      select: { id: true, name: true, licenseNumber: true, specialty: true, createdAt: true },
      orderBy: { createdAt: "asc" },
      take: QUEUE_SIZE,
    }),
    prisma.user.findMany({
      select: { id: true, name: true, role: true, nutritionistStatus: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
  ]);
  const [locale, t, roles, statusLabels] = await Promise.all([
    getLocale(),
    getMessages(homeMessages),
    getMessages(roleMessages),
    getMessages(nutritionistStatusLabels),
  ]);
  await connection();
  const now = new Date();

  return (
    <div className="flex flex-col gap-7">
      <DashboardHeader name={user.name} now={now} />

      <KpiRow>
        <Kpi
          label={t.requestsToReview}
          value={pending}
          hint={queue[0] ? t.oldestFrom(relativeTime(queue[0].createdAt, now, locale)) : t.allCaughtUpShort}
          href="/admin?status=PENDING"
        />
        <Kpi
          label={t.verifiedNutritionists}
          value={approved}
          hint={t.listedInDirectory}
          href="/admin?status=APPROVED"
        />
        <Kpi label={t.clients} value={clients} hint={t.registered} />
        <Kpi label={t.activeLinks} value={activeLinks} hint={t.acceptedRequests} />
      </KpiRow>

      <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        <section className={card}>
          <PanelHeader title={t.waitingForReview} href="/admin?status=PENDING" linkLabel={t.seeAll} />
          {queue.length === 0 ? (
            <p className={muted}>{t.noRequestsWaiting}</p>
          ) : (
            <ul className={list}>
              {queue.map((nutritionist) => (
                <li key={nutritionist.id} className={panelRow}>
                  <div className="min-w-0">
                    <p className="font-semibold">{nutritionist.name}</p>
                    <p className={muted}>
                      {t.license(nutritionist.licenseNumber ?? "—")}
                      {nutritionist.specialty && ` · ${nutritionist.specialty}`} ·{" "}
                      {t.applied(relativeTime(nutritionist.createdAt, now, locale))}
                    </p>
                  </div>
                  <Link
                    href={`/admin?${new URLSearchParams({ status: "PENDING", review: nutritionist.id })}`}
                    className={buttonLink}
                  >
                    {t.review}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={card}>
          <PanelHeader title={t.recentSignUps} />
          <ul className={list}>
            {signUps.map((account) => (
              <li key={account.id} className={panelRow}>
                <div className="min-w-0">
                  <p className="truncate font-semibold">{account.name}</p>
                  <p className={muted}>{roles[account.role]}</p>
                </div>
                <span className="flex items-center gap-2">
                  {account.nutritionistStatus && (
                    <span className={badge(STATUS_TONES[account.nutritionistStatus])}>
                      {statusLabels[account.nutritionistStatus]}
                    </span>
                  )}
                  <span className="text-xs text-tertiary">{relativeTime(account.createdAt, now, locale)}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
