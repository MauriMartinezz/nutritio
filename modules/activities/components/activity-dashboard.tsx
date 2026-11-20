import { getLocale, getMessages } from "@/lib/i18n/server";
import { formatDay } from "@/lib/i18n/format";
import { card, cardSm, h2, kpi, muted } from "@/modules/ui/classes";
import { signedChange, type ActivityDashboard as Dashboard } from "../dashboard";
import { activityMessages } from "../messages";
import { activityLabel, formatDuration } from "../rules";

const shortDay: Intl.DateTimeFormatOptions = { day: "numeric", month: "numeric" };
const CHART_HEIGHT = 144; // px, bar area

function Kpi({ label, value, hint }: { label: string; value: React.ReactNode; hint: string }) {
  return (
    <div className={`${cardSm} gap-2`}>
      <span className="text-sm font-medium text-secondary">{label}</span>
      <span className={`${kpi} text-3xl md:text-4xl`}>{value}</span>
      <span className="text-xs text-tertiary">{hint}</span>
    </div>
  );
}

/** This week against last week, the favorite activity and a bar chart of minutes per week. */
export async function ActivityDashboard({ dashboard }: { dashboard: Dashboard }) {
  const [t, locale] = await Promise.all([getMessages(activityMessages), getLocale()]);
  const { thisWeek, lastWeek, weeks, favorite } = dashboard;

  const minutesChange = signedChange(thisWeek.totalMinutes - lastWeek.totalMinutes, formatDuration);
  const countChange = signedChange(thisWeek.count - lastWeek.count, String);
  const peak = Math.max(...weeks.map((week) => week.minutes), 1);
  const total = weeks.reduce((sum, week) => sum + week.minutes, 0);

  return (
    <div className="flex flex-col gap-6">
      <section aria-label={t.summary} className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <Kpi
          label={t.minutesThisWeek}
          value={formatDuration(thisWeek.totalMinutes)}
          hint={minutesChange ? t.vsLastWeek(minutesChange) : t.sameAsLastWeek}
        />
        <Kpi
          label={t.activitiesThisWeek}
          value={thisWeek.count}
          hint={countChange ? t.vsLastWeek(countChange) : t.sameAsLastWeek}
        />
        <div className="col-span-2 md:col-span-1">
          <Kpi
            label={t.favorite}
            value={<span className="block truncate font-sans text-2xl md:text-3xl">{favorite ? activityLabel(favorite, locale) : "—"}</span>}
            hint={favorite ? t.favoriteHint(favorite.count) : t.noFavorite}
          />
        </div>
      </section>

      <section className={card}>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className={h2}>{t.weeklyChart}</h2>
          <p className={muted}>{t.weeklyChartHint}</p>
        </div>
        <figure className="flex flex-col gap-2">
          <div aria-hidden className="grid grid-cols-8 items-end gap-2 border-b border-line-strong" style={{ height: CHART_HEIGHT + 20 }}>
            {weeks.map((week, index) => {
              const current = index === weeks.length - 1;
              return (
                <div key={week.weekStart.toISOString()} className="flex h-full flex-col items-center justify-end gap-1">
                  <span className={`font-mono text-[11px] tabular-nums ${current ? "font-semibold text-ink" : "text-secondary"}`}>
                    {week.minutes > 0 ? week.minutes : ""}
                  </span>
                  <span
                    className={`w-full max-w-10 rounded-t-[3px] ${current ? "bg-accent" : "bg-accent/35"}`}
                    style={{ height: week.minutes > 0 ? Math.max(2, (week.minutes / peak) * CHART_HEIGHT) : 0 }}
                  />
                </div>
              );
            })}
          </div>
          <div aria-hidden className="grid grid-cols-8 gap-2">
            {weeks.map((week, index) => (
              <span
                key={week.weekStart.toISOString()}
                className={`text-center font-mono text-[11px] tabular-nums ${index === weeks.length - 1 ? "font-semibold text-ink" : "text-tertiary"}`}
              >
                {formatDay(week.weekStart, locale, shortDay)}
              </span>
            ))}
          </div>
          <figcaption className="sr-only">{t.weeklyChartSummary(weeks.length, formatDuration(total))}</figcaption>
          <table className="sr-only">
            <thead>
              <tr>
                <th scope="col">{t.weekOf}</th>
                <th scope="col">{t.minutes}</th>
              </tr>
            </thead>
            <tbody>
              {weeks.map((week) => (
                <tr key={week.weekStart.toISOString()}>
                  <td>{formatDay(week.weekStart, locale)}</td>
                  <td>{week.minutes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </figure>
      </section>
    </div>
  );
}
