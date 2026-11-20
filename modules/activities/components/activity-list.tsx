import { getLocale, getMessages } from "@/lib/i18n/server";
import { formatDay } from "@/lib/i18n/format";
import { figure, list, muted } from "@/modules/ui/classes";
import { FlashNotice } from "@/modules/ui/components/action-feedback";
import { deleteActivity } from "../actions";
import type { ActivityView } from "../dal";
import { activityMessages } from "../messages";
import { activityLabel, formatDuration, intensityLabel } from "../rules";
import { DeleteActivityButton } from "./delete-activity-button";

/** Activities, newest first. With `deletable`, each row gets a delete button (owner only). */
export async function ActivityList({ activities, deletable = false }: { activities: ActivityView[]; deletable?: boolean }) {
  const [t, locale] = await Promise.all([getMessages(activityMessages), getLocale()]);
  if (activities.length === 0) {
    return (
      <>
        <p className={muted}>{t.noActivities}</p>
        {deletable && <FlashNotice />}
      </>
    );
  }

  return (
    <>
      <ul className={list}>
        {activities.map((activity) => (
          <li key={activity.id} className="flex items-start justify-between gap-4 py-3 text-sm first:pt-0 last:pb-0">
            <div className="flex min-w-0 flex-col gap-1">
              <p>
                <span className="font-mono font-medium tabular-nums">{formatDay(activity.performedOn, locale)}</span> ·{" "}
                {activityLabel(activity, locale)} · <span className={figure}>{formatDuration(activity.durationMinutes)}</span> ·{" "}
                {t.intensityLabel(intensityLabel(activity.intensity, locale))}
              </p>
              {activity.notes && <p className="whitespace-pre-line text-secondary">{activity.notes}</p>}
            </div>
            {deletable && (
              <form action={deleteActivity.bind(null, activity.id)} className="shrink-0">
                <DeleteActivityButton />
              </form>
            )}
          </li>
        ))}
      </ul>
      {deletable && <FlashNotice />}
    </>
  );
}
