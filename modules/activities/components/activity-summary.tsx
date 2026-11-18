import { ACTIVITY_TYPES, formatDuration, type WeeklySummary } from "../rules";
import { h3 } from "@/modules/ui/classes";

const day = (date: Date) => date.toLocaleDateString(undefined, { timeZone: "UTC", day: "numeric", month: "short" });

/** This week's totals (Monday–Sunday). Plain markup. */
export function ActivitySummary({ summary }: { summary: WeeklySummary }) {
  return (
    <div className="flex flex-col gap-2 rounded-card-lg bg-accent-tint p-5 text-sm md:p-6">
      <h3 className={h3}>
        This week <span className="font-mono text-sm font-normal text-secondary">({day(summary.weekStart)} – {day(summary.weekEnd)})</span>
      </h3>
      {summary.count === 0 ? (
        <p className="text-secondary">No activities this week yet.</p>
      ) : (
        <>
          <p>
            <span className="font-mono text-2xl font-semibold tabular-nums">{formatDuration(summary.totalMinutes)}</span> ·{" "}
            <span className="font-mono font-semibold tabular-nums">{summary.count}</span>{" "}
            {summary.count === 1 ? "activity" : "activities"}
          </p>
          <p className="text-secondary">
            {summary.byType.map(({ type, minutes }) => `${ACTIVITY_TYPES[type]}: ${formatDuration(minutes)}`).join(" · ")}
          </p>
        </>
      )}
    </div>
  );
}
