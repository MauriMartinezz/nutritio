import Link from "next/link";
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
import { checkInKpi, mealSummary, nextMeeting } from "../dashboard";
import { DashboardHeader, Kpi, KpiRow, PanelHeader, panelRow } from "./dashboard-parts";

const primaryButton = `${buttonPrimary} self-start`;

/**
 * Client dashboard for the home page. Reads the session, so render it inside
 * <Suspense>. Renders nothing for signed-out visitors and other roles.
 */
export async function ClientHome() {
  const user = await getCurrentUser();
  if (user?.role !== "CLIENT") return null;

  const [{ now, links }, { plans }, activity, meetings] = await Promise.all([
    getClientHome(),
    listMyPlans(),
    getOwnActivities(),
    getOwnMeetings(),
  ]);

  if (links.length === 0) {
    return (
      <div className="flex flex-col gap-7">
        <DashboardHeader name={user.name} now={now} />
        <section className={card}>
          <h2 className={h2}>Your follow-up</h2>
          <p className={muted}>You are not working with a nutritionist yet.</p>
          <Link href="/nutritionists" className={primaryButton}>
            Find a nutritionist
          </Link>
        </section>
      </div>
    );
  }

  const plan = plans[0] ?? null;
  const activeLink = links.find((link) => !link.accessExpired) ?? null;
  const weighed = links.find((link) => link.latestWeightKg !== null) ?? null;
  const change = weighed ? weightChange(weighed.weightSeries) : null;
  const checkIn = checkInKpi(activeLink);
  const meeting = nextMeeting(meetings.flatMap((link) => link.requests), now);
  const pendingMeeting = meetings.some((link) => link.hasPending);

  return (
    <div className="flex flex-col gap-7">
      <DashboardHeader name={user.name} now={now} />

      <KpiRow>
        <Kpi
          label="Today's plan"
          value={plan ? <>{Math.round(plan.totals.kcal)}<span className="text-base"> kcal</span></> : "—"}
          hint={
            plan
              ? `P ${Math.round(plan.totals.proteinG)} g · C ${Math.round(plan.totals.carbsG)} g · F ${Math.round(plan.totals.fatG)} g`
              : "No plan yet"
          }
          href={plan ? `/my-plans/${plan.id}` : undefined}
        />
        <Kpi
          label="Latest weight"
          value={weighed?.latestWeightKg != null ? formatKg(weighed.latestWeightKg) : "—"}
          hint={change !== null ? `${formatWeightChange(change)} since you started` : "Log it in a check-in"}
          href="/check-ins"
        />
        <Kpi label="Next check-in" value={checkIn.value} hint={checkIn.hint} href="/check-ins" />
        <Kpi
          label="Activity this week"
          value={formatDuration(activity.summary.totalMinutes)}
          hint={`${activity.summary.count} ${activity.summary.count === 1 ? "activity" : "activities"}`}
          href="/activities"
        />
      </KpiRow>

      <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        <div className="flex flex-col gap-6">
          {plan?.notes && (
            <section className={cardAccent}>
              <p className={eyebrow}>Note from {plan.nutritionist.name}</p>
              <p className="whitespace-pre-line">{plan.notes}</p>
            </section>
          )}
          <section className={card}>
            <PanelHeader
              title="Today's meals"
              href={plans.length > 1 ? "/my-plans" : undefined}
              linkLabel={`All plans (${plans.length})`}
            />
            {!plan ? (
              <p className={muted}>
                {activeLink ? "Your nutritionist hasn't shared a plan yet." : "Renew your access to see your plans."}
              </p>
            ) : (
              <>
                <p className={muted}>{plan.name}</p>
                <ul className={list}>
                  {plan.meals.map((meal) => (
                    <li key={meal.id} className={panelRow}>
                      <div className="min-w-0">
                        <p className="font-semibold">{meal.name}</p>
                        <p className={muted}>{mealSummary(meal.items)}</p>
                      </div>
                      <span className={`${figure} text-sm`}>{Math.round(meal.perServing.kcal)} kcal</span>
                    </li>
                  ))}
                </ul>
                <div className="flex flex-wrap gap-2">
                  <Link href={`/my-plans/${plan.id}`} className={buttonSecondary}>
                    Open plan
                  </Link>
                  <Link href={`/my-plans/${plan.id}/shopping-list`} className={buttonSecondary}>
                    Shopping list
                  </Link>
                </div>
              </>
            )}
          </section>
        </div>

        <div className="flex flex-col gap-6">
          {links.map((link) => (
            <LinkCard key={link.linkId} link={link} now={now} />
          ))}
          {activeLink && (
            <section className={card}>
              <PanelHeader title="Meetings" href="/meetings" linkLabel="Open" />
              {meeting ? (
                <p className="text-sm">
                  Next meeting:{" "}
                  <span className={figure}>{meeting.scheduledFor!.toLocaleString()}</span>
                </p>
              ) : (
                <p className={muted}>
                  {pendingMeeting ? "Your meeting request is waiting for an answer." : "No meetings scheduled."}
                </p>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

function LinkCard({ link, now }: { link: ClientHomeLink; now: Date }) {
  const daysLeft = accessDaysLeft(link.accessUntil, now);
  const change = weightChange(link.weightSeries);

  return (
    <article className={card}>
      <div className="flex flex-col gap-1">
        <h3 className="text-lg font-semibold tracking-tight">{link.nutritionistName}</h3>
        <p className={link.accessExpired ? `${callout("danger")} font-medium` : muted}>
          {describeAccess({ expired: link.accessExpired, daysLeft }, link.nutritionistName)}
          {!link.accessExpired && link.accessUntil && ` (until ${link.accessUntil.toLocaleDateString()})`}
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
            {describeCheckInStatus(link)}
            {link.due && link.state === "UPCOMING" && ` (${link.due.toLocaleDateString()})`}
          </p>
          {link.state === "DUE" && (
            <Link href="/check-ins" className={primaryButton}>
              Send check-in
            </Link>
          )}
        </div>
      )}

      {link.latestWeightKg !== null && (
        <div className="flex flex-col gap-4 border-t border-divider pt-4">
          {/* Flex drops the {" "} nodes visually, but they keep the text "Latest weight: 71.5 kg · …". */}
          <p className={`${eyebrow} flex flex-wrap items-baseline gap-x-3 gap-y-2`}>
            <span className="basis-full">Latest weight:</span>{" "}
            <span className={`${kpi} text-ink`}>{formatKg(link.latestWeightKg)}</span>
            {change !== null && (
              <span className="font-normal">
                {" · "}
                <span className="font-mono font-semibold tabular-nums text-ink">{formatWeightChange(change)}</span>
                {` since ${link.weightSeries[0].date.toLocaleDateString()}`}
              </span>
            )}
          </p>
          <WeightChart series={link.weightSeries} />
        </div>
      )}
    </article>
  );
}
