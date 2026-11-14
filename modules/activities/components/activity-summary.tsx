import { ACTIVITY_TYPES, formatDuration, type WeeklySummary } from "../rules";

const day = (date: Date) => date.toLocaleDateString(undefined, { timeZone: "UTC", day: "numeric", month: "short" });

/** This week's totals (Monday–Sunday). Plain markup. */
export function ActivitySummary({ summary }: { summary: WeeklySummary }) {
  return (
    <div className="flex flex-col gap-1 rounded-md border border-zinc-200 p-4 text-sm dark:border-zinc-800">
      <h3 className="font-semibold">
        This week <span className="font-normal text-zinc-500">({day(summary.weekStart)} – {day(summary.weekEnd)})</span>
      </h3>
      {summary.count === 0 ? (
        <p className="text-zinc-500">No activities this week yet.</p>
      ) : (
        <>
          <p>
            {formatDuration(summary.totalMinutes)} · {summary.count}{" "}
            {summary.count === 1 ? "activity" : "activities"}
          </p>
          <p className="text-zinc-600 dark:text-zinc-400">
            {summary.byType.map(({ type, minutes }) => `${ACTIVITY_TYPES[type]}: ${formatDuration(minutes)}`).join(" · ")}
          </p>
        </>
      )}
    </div>
  );
}
