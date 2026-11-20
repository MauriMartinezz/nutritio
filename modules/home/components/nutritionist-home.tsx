import Link from "next/link";
import { formatDateTime, formatNumber } from "@/lib/i18n/format";
import { getLocale, getMessages } from "@/lib/i18n/server";
import { activityLabel } from "@/modules/activities/rules";
import { rosterHref, timeLeftLabel } from "@/modules/coaching/roster";
import { getCurrentUser } from "@/modules/identity/dal";
import { buttonLink, card, figure, link, list, muted } from "@/modules/ui/classes";
import { DashboardHeader, Kpi, KpiRow, PanelHeader, panelRow } from "./dashboard-parts";
import { relativeTime, shortDate } from "../dashboard";
import { homeMessages } from "../messages";
import { getNutritionistDashboard, type FeedDetail } from "../nutritionist-dashboard-dal";

const ATTENTION_LIMIT = 6;
const rowClass = panelRow;

/**
 * Home dashboard for approved nutritionists. Reads the session: render inside
 * <Suspense>. Renders nothing for other users.
 */
export async function NutritionistHome() {
  const user = await getCurrentUser();
  if (user?.role !== "NUTRITIONIST" || user.nutritionistStatus !== "APPROVED") return null;

  const [data, locale, t] = await Promise.all([getNutritionistDashboard(user), getLocale(), getMessages(homeMessages)]);
  const describe = (detail: FeedDetail) =>
    detail.kind === "checkIn"
      ? t.checkedInAt(formatNumber(detail.weightKg, locale, { maximumFractionDigits: 1 }))
      : t.logged(activityLabel(detail, locale), detail.minutes);
  const { now } = data;
  const needsAction = data.pendingRequests.length + data.meetingRequests.length;

  const attention = [
    ...data.pendingRequests.map((c) => ({
      key: `p${c.linkId}`,
      name: c.name,
      detail: t.wantsToWork,
      href: rosterHref("all", { accept: c.linkId }),
      action: t.review,
    })),
    ...data.meetingRequests.map((m) => ({
      key: `m${m.id}`,
      name: m.name,
      detail: `${t.askedFor[m.kind]} · ${relativeTime(m.at, now, locale)}`,
      href: rosterHref("all", { meeting: m.id }),
      action: t.answer,
    })),
    ...data.expired.map((c) => ({
      key: `e${c.linkId}`,
      name: c.name,
      detail: t.accessStatus(timeLeftLabel(c.until, now, locale)),
      href: `/clients/${c.clientId}`,
      action: t.open,
    })),
  ];

  return (
    <div className="flex flex-col gap-7">
      <DashboardHeader name={user.name} now={now} />

      <KpiRow>
        <Kpi
          label={t.activeClients}
          value={data.activeCount}
          hint={data.newThisMonth > 0 ? t.newThisMonth(data.newThisMonth) : t.noneNewThisMonth}
          href="/clients?filter=active"
        />
        <Kpi
          label={t.needsAction}
          value={needsAction}
          hint={t.requestsAndMeetings}
          href="/clients?filter=needs-action"
        />
        <Kpi
          label={t.accessEndingThisWeek}
          value={data.expiring.length}
          hint={data.expired.length > 0 ? t.alreadyExpired(data.expired.length) : t.noneExpired}
          href="/clients?filter=expiring"
        />
        <Kpi
          label={t.dietAdherence}
          value={data.adherence.average === null ? "—" : `${data.adherence.average}%`}
          hint={t.adherenceHint(data.adherence.checkIns)}
        />
      </KpiRow>

      <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        <section className={card}>
          <PanelHeader title={t.needsAttention} href="/clients?filter=needs-action" linkLabel={t.seeAll} />
          {attention.length === 0 ? (
            <p className={muted}>{t.allCaughtUp}</p>
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
          <PanelHeader title={t.renewalsNextWeek} href="/clients?filter=expiring" linkLabel={t.seeAll} />
          {data.expiring.length === 0 ? (
            <p className={muted}>{t.noRenewals}</p>
          ) : (
            <ul className={list}>
              {data.expiring.map((c) => (
                <li key={c.linkId} className={rowClass}>
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="w-10 shrink-0 font-mono text-xs font-semibold uppercase text-secondary">
                      {c.until &&
                        formatDateTime(c.until, locale, { dateStyle: undefined, timeStyle: undefined, weekday: "short" })}
                    </span>
                    <div className="min-w-0">
                      <Link href={`/clients/${c.clientId}`} className={`${link} font-semibold`}>
                        {c.name}
                      </Link>
                      <p className={muted}>
                        {t.ends} <span className={figure}>{c.until && shortDate(c.until, locale)}</span>
                      </p>
                    </div>
                  </div>
                  <Link href={rosterHref("expiring", { renew: c.linkId })} className={buttonLink}>
                    {t.renew}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className={card}>
        <PanelHeader title={t.clientActivity} />
        {data.feed.length === 0 ? (
          <p className={muted}>{t.noClientActivity}</p>
        ) : (
          <ul className={list}>
            {data.feed.map((event) => (
              <li key={event.id} className={rowClass}>
                <p className="min-w-0 text-sm">
                  <Link href={`/clients/${event.clientId}`} className={`${link} font-semibold`}>
                    {event.name}
                  </Link>{" "}
                  {describe(event.detail)}
                </p>
                <span className="text-xs text-tertiary">{relativeTime(event.at, now, locale)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
