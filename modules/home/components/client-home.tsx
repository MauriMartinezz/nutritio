import Link from "next/link";
import { formatDateTime } from "@/lib/i18n/format";
import type { Locale } from "@/lib/i18n/negotiate";
import { getLocale, getMessages } from "@/lib/i18n/server";
import { getCurrentUser } from "@/modules/identity/dal";
import { getClientHome, type ClientHomeLink } from "@/modules/checkins/dal";
import { describeCheckInStatus } from "@/modules/checkins/rules";
import { WeightChart } from "@/modules/checkins/components/weight-chart";
import { formatKg, formatWeightChange, weightChange } from "@/modules/checkins/weight-chart";
import { formatDuration } from "@/modules/activities/rules";
import { getOwnActivities } from "@/modules/activities/dal";
import { getOwnMeetings } from "@/modules/meetings/dal";
import { listMyPlans } from "@/modules/plans/dal";
import {
  buttonPrimary,
  buttonSecondary,
  callout,
  card,
  cardAccent,
  eyebrow,
  figure,
  h2,
  kpi,
  list,
  muted,
} from "@/modules/ui/classes";
import { accessDaysLeft, describeAccess } from "../access-summary";
import { checkInKpi, mealSummary, nextMeeting, shortDate } from "../dashboard";
import { homeMessages } from "../messages";
import { DashboardHeader, Kpi, KpiRow, PanelHeader, panelRow } from "./dashboard-parts";

const primaryButton = `${buttonPrimary} self-start`;

/**
 * Client dashboard for the home page. Reads the session, so render it inside
 * <Suspense>. Renders nothing for signed-out visitors and other roles.
 */
export async function ClientHome() {
  const user = await getCurrentUser();
  if (user?.role !== "CLIENT") return null;

  const [{ now, links }, { plans }, activity, meetings, locale, t] = await Promise.all([
    getClientHome(),
    listMyPlans(),
    getOwnActivities(),
    getOwnMeetings(),
    getLocale(),
    getMessages(homeMessages),
  ]);

  if (links.length === 0) {
    return (
      <div className="flex flex-col gap-7">
        <DashboardHeader name={user.name} now={now} />
        <section className={card}>
          <h2 className={h2}>{t.yourFollowUp}</h2>
          <p className={muted}>{t.noNutritionist}</p>
          <Link href="/nutritionists" className={primaryButton}>
            {t.findNutritionist}
          </Link>
        </section>
      </div>
    );
  }

  const plan = plans[0] ?? null;
  const activeLink = links.find((link) => !link.accessExpired) ?? null;
  const weighed = links.find((link) => link.latestWeightKg !== null) ?? null;
  const change = weighed ? weightChange(weighed.weightSeries) : null;
  const checkIn = checkInKpi(activeLink, locale);
  const meeting = nextMeeting(meetings.flatMap((link) => link.requests), now);
  const pendingMeeting = meetings.some((link) => link.hasPending);

  return (
    <div className="flex flex-col gap-7">
      <DashboardHeader name={user.name} now={now} />

      <KpiRow>
        <Kpi
          label={t.todaysPlan}
          value={plan ? <>{Math.round(plan.totals.kcal)}<span className="text-base"> kcal</span></> : "—"}
          hint={
            plan
              ? t.macros(Math.round(plan.totals.proteinG), Math.round(plan.totals.carbsG), Math.round(plan.totals.fatG))
              : t.noPlanYet
          }
          href={plan ? `/nutritionists/${plan.nutritionist.id}#plan` : undefined}
        />
        <Kpi
          label={t.latestWeight}
          value={weighed?.latestWeightKg != null ? formatKg(weighed.latestWeightKg, locale) : "—"}
          hint={change !== null ? t.sinceYouStarted(formatWeightChange(change, locale)) : t.logItInCheckIn}
          href="/check-ins"
        />
        <Kpi label={t.nextCheckIn} value={checkIn.value} hint={checkIn.hint} href="/check-ins" />
        <Kpi
          label={t.activityThisWeek}
          value={formatDuration(activity.summary.totalMinutes)}
          hint={t.activityCount(activity.summary.count)}
          href="/activities"
        />
      </KpiRow>

      <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        <div className="flex flex-col gap-6">
          {plan?.notes && (
            <section className={cardAccent}>
              <p className={eyebrow}>{t.noteFrom(plan.nutritionist.name)}</p>
              <p className="whitespace-pre-line">{plan.notes}</p>
            </section>
          )}
          <section className={card}>
            <PanelHeader
              title={t.todaysMeals}
              href={plans.length > 1 ? "/my-plans" : undefined}
              linkLabel={t.allPlans(plans.length)}
            />
            {!plan ? (
              <p className={muted}>
                {activeLink ? t.planNotShared : t.renewToSeePlans}
              </p>
            ) : (
              <>
                <p className={muted}>{plan.name}</p>
                <ul className={list}>
                  {plan.meals.map((meal) => (
                    <li key={meal.id} className={panelRow}>
                      <div className="min-w-0">
                        <p className="font-semibold">{meal.name}</p>
                        <p className={muted}>{mealSummary(meal.items, 3, locale)}</p>
                      </div>
                      <span className={`${figure} text-sm`}>{Math.round(meal.perServing.kcal)} kcal</span>
                    </li>
                  ))}
                </ul>
                <div className="flex flex-wrap gap-2">
                  <Link href={`/nutritionists/${plan.nutritionist.id}#plan`} className={buttonSecondary}>
                    {t.openPlan}
                  </Link>
                  <Link href={`/my-plans/${plan.id}/shopping-list`} className={buttonSecondary}>
                    {t.shoppingList}
                  </Link>
                </div>
              </>
            )}
          </section>
        </div>

        <div className="flex flex-col gap-6">
          {links.map((link) => (
            <LinkCard key={link.linkId} link={link} now={now} locale={locale} t={t} />
          ))}
          {activeLink && (
            <section className={card}>
              <PanelHeader title={t.meetings} href="/meetings" linkLabel={t.open} />
              {meeting ? (
                <p className="text-sm">
                  {t.nextMeeting}{" "}
                  <span className={figure}>{formatDateTime(meeting.scheduledFor!, locale)}</span>
                </p>
              ) : (
                <p className={muted}>
                  {pendingMeeting ? t.meetingWaiting : t.noMeetings}
                </p>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

type HomeTexts = (typeof homeMessages)["en"];

function LinkCard({ link, now, locale, t }: { link: ClientHomeLink; now: Date; locale: Locale; t: HomeTexts }) {
  const daysLeft = accessDaysLeft(link.accessUntil, now);
  const change = weightChange(link.weightSeries);

  return (
    <article className={card}>
      <div className="flex flex-col gap-1">
        <h3 className="flex flex-wrap items-center justify-between gap-2 text-lg font-semibold tracking-tight">
          <Link href={`/nutritionists/${link.nutritionistId}`} className="hover:text-accent hover:underline">
            {link.nutritionistName}
          </Link>
          <Link href={`/nutritionists/${link.nutritionistId}#plan`} className={buttonSecondary}>
            {t.planMacrosShopping}
          </Link>
        </h3>
        <p className={link.accessExpired ? `${callout("danger")} font-medium` : muted}>
          {describeAccess({ expired: link.accessExpired, daysLeft }, link.nutritionistName, locale)}
          {!link.accessExpired && link.accessUntil && t.until(shortDate(link.accessUntil, locale))}
        </p>
      </div>

      {!link.accessExpired && (
        <div
          className={
            link.state === "DUE"
              ? `${callout("warning")} flex flex-wrap items-center justify-between gap-3`
              : "flex flex-col gap-2"
          }
        >
          <p className={link.state === "DUE" ? "font-medium" : muted}>
            {describeCheckInStatus(link, locale)}
            {link.due && link.state === "UPCOMING" && ` (${shortDate(link.due, locale)})`}
          </p>
          {link.state === "DUE" && (
            <Link href="/check-ins" className={primaryButton}>
              {t.sendCheckIn}
            </Link>
          )}
        </div>
      )}

      {link.latestWeightKg !== null && (
        <div className="flex flex-col gap-4 border-t border-divider pt-4">
          {/* Flex drops the {" "} nodes visually, but they keep the text "Latest weight: 71.5 kg · …". */}
          <p className={`${eyebrow} flex flex-wrap items-baseline gap-x-3 gap-y-2`}>
            <span className="basis-full">{t.latestWeightLabel}</span>{" "}
            <span className={`${kpi} text-ink`}>{formatKg(link.latestWeightKg, locale)}</span>
            {change !== null && (
              <span className="font-normal">
                {" · "}
                <span className="font-mono font-semibold tabular-nums text-ink">{formatWeightChange(change, locale)}</span>
                {t.since(shortDate(link.weightSeries[0].date, locale))}
              </span>
            )}
          </p>
          <WeightChart series={link.weightSeries} />
        </div>
      )}
    </article>
  );
}
