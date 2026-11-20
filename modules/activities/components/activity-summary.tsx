import { getLocale, getMessages } from "@/lib/i18n/server";
import { formatDay } from "@/lib/i18n/format";
import { h3 } from "@/modules/ui/classes";
import { activityMessages } from "../messages";
import { activityTypeLabel, formatDuration, type WeeklySummary } from "../rules";

const shortDay: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };

/** This week's totals (Monday–Sunday). Plain markup. */
export async function ActivitySummary({ summary }: { summary: WeeklySummary }) {
  const [t, locale] = await Promise.all([getMessages(activityMessages), getLocale()]);
  return (
    <div className="flex flex-col gap-2 rounded-card-lg bg-accent-tint p-5 text-sm md:p-6">
      <h3 className={h3}>
        {t.thisWeek}{" "}
        <span className="font-mono text-sm font-normal text-secondary">
          ({formatDay(summary.weekStart, locale, shortDay)} – {formatDay(summary.weekEnd, locale, shortDay)})
        </span>
      </h3>
      {summary.count === 0 ? (
        <p className="text-secondary">{t.noneThisWeek}</p>
      ) : (
        <>
          <p>
            <span className="font-mono text-2xl font-semibold tabular-nums">{formatDuration(summary.totalMinutes)}</span> ·{" "}
            <span className="font-mono font-semibold tabular-nums">{summary.count}</span> {t.activityWord(summary.count)}
          </p>
          <p className="text-secondary">
            {summary.byType
              .map(({ type, minutes }) => `${activityTypeLabel(type, locale)}: ${formatDuration(minutes)}`)
              .join(" · ")}
          </p>
        </>
      )}
    </div>
  );
}
