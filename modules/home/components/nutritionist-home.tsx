import Link from "next/link";
import type { ReactNode } from "react";
import { renewClientAccess } from "@/modules/coaching/actions";
import { QuickPeriodForm } from "@/modules/coaching/components/quick-period-form";
import { timeLeftLabel } from "@/modules/coaching/roster";
import { getCurrentUser } from "@/modules/identity/dal";
import { buttonLink, card, cardSm, eyebrow, figure, h1, h2, kpi, link, list, muted } from "@/modules/ui/classes";
import { relativeTime } from "../dashboard";
import { getNutritionistDashboard } from "../nutritionist-dashboard-dal";

const ATTENTION_LIMIT = 6;

function Kpi({ label, value, hint, href }: { label: string; value: ReactNode; hint: string; href?: string }) {
  const body = (
    <>
      <span className="text-sm font-medium text-secondary">{label}</span>
      <span className={kpi}>{value}</span>
      <span className="text-xs text-tertiary">{hint}</span>
    </>
  );
  return href ? (
    <Link href={href} className={`${cardSm} gap-2 hover:border-line-strong hover:bg-surface-muted`}>
      {body}
    </Link>
  ) : (
    <div className={`${cardSm} gap-2`}>{body}</div>
  );
}

function PanelHeader({ title, href, linkLabel }: { title: string; href?: string; linkLabel?: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h2 className={h2}>{title}</h2>
      {href && (
        <Link href={href} className={buttonLink}>
          {linkLabel}
        </Link>
      )}
    </div>
  );
}

const rowClass = "flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0";

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
      <header className="flex flex-col gap-1">
        <p className={eyebrow}>
          {now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </p>
        <h1 className={h1}>Hi, {user.name.split(/\s+/)[0]}</h1>
      </header>

      <section aria-label="Summary" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
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
      </section>

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
