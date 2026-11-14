import Link from "next/link";
import { renewClientAccess } from "@/modules/coaching/actions";
import { QuickPeriodForm } from "@/modules/coaching/components/quick-period-form";
import { timeLeftLabel } from "@/modules/coaching/roster";
import { getCurrentUser } from "@/modules/identity/dal";
import { buttonLink, card, figure, link, list, muted } from "@/modules/ui/classes";
import { DashboardHeader, Kpi, KpiRow, PanelHeader, panelRow } from "./dashboard-parts";
import { relativeTime } from "../dashboard";
import { getNutritionistDashboard } from "../nutritionist-dashboard-dal";

const ATTENTION_LIMIT = 6;
const rowClass = panelRow;

/**
 * Home dashboard for approved nutritionists. Reads the session: render inside
 * <Suspense>. Renders nothing for other users.
 */
export async function NutritionistHome() {
  const user = await getCurrentUser();
  if (user?.role !== "NUTRITIONIST" || user.nutritionistStatus !== "APPROVED") return null;

  const data = await getNutritionistDashboard(user);
  const { now } = data;
  const needsAction = data.pendingRequests.length + data.meetingRequests.length;

  const attention = [
    ...data.pendingRequests.map((c) => ({
      key: `p${c.linkId}`,
      name: c.name,
      detail: "Wants to work with you",
      href: "/clients?filter=pending",
      action: "Review",
    })),
    ...data.meetingRequests.map((m) => ({
      key: `m${m.id}`,
      name: m.name,
      detail: `Asked for a ${m.kind.toLowerCase()} · ${relativeTime(m.at, now)}`,
      href: "/clients#meeting-requests",
      action: "Answer",
    })),
    ...data.expired.map((c) => ({
      key: `e${c.linkId}`,
      name: c.name,
      detail: `Access ${timeLeftLabel(c.until, now).toLowerCase()}`,
      href: `/clients/${c.clientId}`,
      action: "Open",
    })),
  ];

  return (
    <div className="flex flex-col gap-7">
      <DashboardHeader name={user.name} now={now} />

      <KpiRow>
        <Kpi
          label="Active clients"
          value={data.activeCount}
          hint={data.newThisMonth > 0 ? `+${data.newThisMonth} this month` : "None new this month"}
          href="/clients?filter=active"
        />
        <Kpi
          label="Needs action"
          value={needsAction}
          hint="Requests and meetings"
          href="/clients?filter=needs-action"
        />
        <Kpi
          label="Access ending this week"
          value={data.expiring.length}
          hint={data.expired.length > 0 ? `${data.expired.length} already expired` : "None expired"}
          href="/clients?filter=expiring"
        />
        <Kpi
          label="Diet adherence"
          value={data.adherence.average === null ? "—" : `${data.adherence.average}%`}
          hint={`Average of ${data.adherence.checkIns} check-in${data.adherence.checkIns === 1 ? "" : "s"} · 30 days`}
        />
      </KpiRow>

      <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        <section className={card}>
          <PanelHeader title="Needs attention" href="/clients?filter=needs-action" linkLabel="See all" />
          {attention.length === 0 ? (
            <p className={muted}>You are all caught up.</p>
          ) : (
            <ul className={list}>
              {attention.slice(0, ATTENTION_LIMIT).map((item) => (
                <li key={item.key} className={rowClass}>
                  <div className="min-w-0">
                    <p className="font-semibold">{item.name}</p>
                    <p className={muted}>{item.detail}</p>
                  </div>
                  <Link href={item.href} className={buttonLink}>
                    {item.action}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={card}>
          <PanelHeader title="Renewals · next 7 days" href="/clients?filter=expiring" linkLabel="See all" />
          {data.expiring.length === 0 ? (
            <p className={muted}>No access ends in the next 7 days.</p>
          ) : (
            <ul className={list}>
              {data.expiring.map((c) => (
                <li key={c.linkId} className={rowClass}>
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="w-10 shrink-0 font-mono text-xs font-semibold uppercase text-secondary">
                      {c.until?.toLocaleDateString("en-US", { weekday: "short" })}
                    </span>
                    <div className="min-w-0">
                      <Link href={`/clients/${c.clientId}`} className={`${link} font-semibold`}>
                        {c.name}
                      </Link>
                      <p className={muted}>
                        Ends <span className={figure}>{c.until?.toLocaleDateString()}</span>
                      </p>
                    </div>
                  </div>
                  <QuickPeriodForm
                    action={renewClientAccess.bind(null, c.linkId)}
                    placeholder="Renew…"
                    submitLabel="Renew"
                    label={`Renew ${c.name} for`}
                    customDefault={c.period}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className={card}>
        <PanelHeader title="Client activity" />
        {data.feed.length === 0 ? (
          <p className={muted}>Check-ins and activities your clients log will show up here.</p>
        ) : (
          <ul className={list}>
            {data.feed.map((event) => (
              <li key={event.id} className={rowClass}>
                <p className="min-w-0 text-sm">
                  <Link href={`/clients/${event.clientId}`} className={`${link} font-semibold`}>
                    {event.name}
                  </Link>{" "}
                  {event.text}
                </p>
                <span className="text-xs text-tertiary">{relativeTime(event.at, now)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
