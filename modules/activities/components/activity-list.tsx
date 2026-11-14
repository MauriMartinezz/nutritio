import { deleteActivity } from "../actions";
import type { ActivityView } from "../dal";
import { INTENSITIES, activityLabel, formatDuration } from "../rules";

/** Activities, newest first. With `deletable`, each row gets a delete button (owner only). */
export function ActivityList({ activities, deletable = false }: { activities: ActivityView[]; deletable?: boolean }) {
  if (activities.length === 0) {
    return <p className="text-sm text-zinc-500">No activities in the last 30 days.</p>;
  }

  return (
    <ul className="flex flex-col divide-y divide-zinc-200 dark:divide-zinc-800">
      {activities.map((activity) => (
        <li key={activity.id} className="flex items-start justify-between gap-4 py-3 text-sm">
          <div className="flex flex-col gap-1">
            <p>
              <span className="font-medium">{activity.performedOn.toLocaleDateString(undefined, { timeZone: "UTC" })}</span>{" "}
              · {activityLabel(activity)} · {formatDuration(activity.durationMinutes)} ·{" "}
              {INTENSITIES[activity.intensity]} intensity
            </p>
            {activity.notes && <p className="whitespace-pre-line text-zinc-600 dark:text-zinc-400">{activity.notes}</p>}
          </div>
          {deletable && (
            <form action={deleteActivity.bind(null, activity.id)}>
              <button type="submit" className="text-sm text-red-600 underline hover:text-red-700">
                Delete
              </button>
            </form>
          )}
        </li>
      ))}
    </ul>
  );
}
