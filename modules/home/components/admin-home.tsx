import Link from "next/link";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/modules/identity/dal";
import { STATUS_LABELS, STATUS_TONES } from "@/modules/nutritionists/components/status";
import { badge, buttonLink, card, list, muted } from "@/modules/ui/classes";
import { relativeTime } from "../dashboard";
import { DashboardHeader, Kpi, KpiRow, PanelHeader, panelRow } from "./dashboard-parts";

const QUEUE_SIZE = 5;
const ROLE_LABELS = { ADMIN: "Administrator", NUTRITIONIST: "Nutritionist", CLIENT: "Client" } as const;

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
  await connection();
  const now = new Date();

  return (
    <div className="flex flex-col gap-7">
      <DashboardHeader name={user.name} now={now} />

      <KpiRow>
        <Kpi
          label="Requests to review"
          value={pending}
          hint={queue[0] ? `Oldest from ${relativeTime(queue[0].createdAt, now).toLowerCase()}` : "All caught up"}
          href="/admin?status=PENDING"
        />
        <Kpi label="Verified nutritionists" value={approved} hint="Listed in the directory" href="/admin?status=APPROVED" />
        <Kpi label="Clients" value={clients} hint="Registered on the platform" />
        <Kpi label="Active coaching links" value={activeLinks} hint="Accepted client requests" />
      </KpiRow>

      <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        <section className={card}>
          <PanelHeader title="Waiting for review" href="/admin?status=PENDING" linkLabel="See all" />
          {queue.length === 0 ? (
            <p className={muted}>No requests waiting. Nice.</p>
          ) : (
            <ul className={list}>
              {queue.map((nutritionist) => (
                <li key={nutritionist.id} className={panelRow}>
                  <div className="min-w-0">
                    <p className="font-semibold">{nutritionist.name}</p>
                    <p className={muted}>
                      License {nutritionist.licenseNumber ?? "—"}
                      {nutritionist.specialty && ` · ${nutritionist.specialty}`} · applied{" "}
                      {relativeTime(nutritionist.createdAt, now).toLowerCase()}
                    </p>
                  </div>
                  <Link
                    href={`/admin?${new URLSearchParams({ status: "PENDING", review: nutritionist.id })}`}
                    className={buttonLink}
                  >
                    Review
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={card}>
          <PanelHeader title="Recent sign-ups" />
          <ul className={list}>
            {signUps.map((account) => (
              <li key={account.id} className={panelRow}>
                <div className="min-w-0">
                  <p className="truncate font-semibold">{account.name}</p>
                  <p className={muted}>{ROLE_LABELS[account.role]}</p>
                </div>
                <span className="flex items-center gap-2">
                  {account.nutritionistStatus && (
                    <span className={badge(STATUS_TONES[account.nutritionistStatus])}>
                      {STATUS_LABELS[account.nutritionistStatus]}
                    </span>
                  )}
                  <span className="text-xs text-tertiary">{relativeTime(account.createdAt, now)}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
