import { deleteActivity } from "../actions";
import type { ActivityView } from "../dal";
import { figure, list, muted } from "@/modules/ui/classes";
import { INTENSITIES, activityLabel, formatDuration } from "../rules";

/** Activities, newest first. With `deletable`, each row gets a delete button (owner only). */
export function ActivityList({ activities, deletable = false }: { activities: ActivityView[]; deletable?: boolean }) {
  if (activities.length === 0) {
    return <p className={muted}>No activities in the last 30 days.</p>;
  }

  return (
    <ul className={list}>
      {activities.map((activity) => (
        <li key={activity.id} className="flex items-start justify-between gap-4 py-3 text-sm first:pt-0 last:pb-0">
          <div className="flex min-w-0 flex-col gap-1">
            <p>
              <span className="font-mono font-medium tabular-nums">
                {activity.performedOn.toLocaleDateString(undefined, { timeZone: "UTC" })}
              </span>{" "}
              · {activityLabel(activity)} · <span className={figure}>{formatDuration(activity.durationMinutes)}</span> ·{" "}
              {INTENSITIES[activity.intensity]} intensity
            </p>
            {activity.notes && <p className="whitespace-pre-line text-secondary">{activity.notes}</p>}
          </div>
          {deletable && (
            <form action={deleteActivity.bind(null, activity.id)} className="shrink-0">
              <button type="submit" className="inline-flex min-h-11 items-center text-sm font-semibold text-danger hover:underline">
                Delete
              </button>
            </form>
          )}
        </li>
      ))}
    </ul>
  );
}
