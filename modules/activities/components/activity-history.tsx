import { getLocale, getMessages } from "@/lib/i18n/server";
import { formatDay } from "@/lib/i18n/format";
import { badge, muted, type Tone } from "@/modules/ui/classes";
import { FlashNotice } from "@/modules/ui/components/action-feedback";
import { deleteActivity } from "../actions";
import type { ActivityView } from "../dal";
import { activityMessages } from "../messages";
import { activityLabel, formatDuration, intensityLabel, type Intensity } from "../rules";
import { DeleteActivityButton } from "./delete-activity-button";

const INTENSITY_TONES: Record<Intensity, Tone> = { LOW: "neutral", MEDIUM: "accent", HIGH: "warning" };

// Stacked label/value rows on phones, a real table from md up.
const cell =
  "flex items-start justify-between gap-3 before:text-xs before:font-medium before:text-secondary before:content-[attr(data-label)] md:table-cell md:px-3 md:py-2 md:align-middle md:before:content-none md:first:pl-0";

/** The owner's activities as a table, newest first, each with a delete button. */
export async function ActivityHistory({ activities }: { activities: ActivityView[] }) {
  const [t, locale] = await Promise.all([getMessages(activityMessages), getLocale()]);
  // Deleting removes the row and its form: the notice is shown from outside them.
  if (activities.length === 0) {
    return (
      <>
        <p className={muted}>{t.noHistory}</p>
        <FlashNotice />
      </>
    );
  }

  return (
    <>
      <table className="block w-full text-sm md:table">
        <thead className="hidden border-b border-line text-left text-xs text-secondary md:table-header-group">
          <tr>
            {[t.date, t.activity, t.duration, t.intensity, t.notes].map((heading) => (
              <th key={heading} scope="col" className="px-3 pb-3 font-medium first:pl-0">
                {heading}
              </th>
            ))}
            <th scope="col" className="pb-3 pl-3 text-right font-medium">
              <span className="sr-only">{t.actions}</span>
            </th>
          </tr>
        </thead>
        <tbody className="block divide-y divide-divider md:table-row-group">
          {activities.map((activity) => (
            <tr key={activity.id} className="flex flex-col gap-2 py-4 first:pt-0 last:pb-0 md:table-row">
              <td data-label={t.date} className={`${cell} md:whitespace-nowrap`}>
                <span className="font-mono tabular-nums">{formatDay(activity.performedOn, locale)}</span>
              </td>
              <th scope="row" data-label={t.activity} className={`${cell} text-left font-semibold`}>
                <span>{activityLabel(activity, locale)}</span>
              </th>
              <td data-label={t.duration} className={`${cell} md:whitespace-nowrap`}>
                <span className="font-mono font-semibold tabular-nums">{formatDuration(activity.durationMinutes)}</span>
              </td>
              <td data-label={t.intensity} className={cell}>
                <span className={badge(INTENSITY_TONES[activity.intensity])}>{intensityLabel(activity.intensity, locale)}</span>
              </td>
              <td data-label={t.notes} className={`${cell} md:max-w-72`}>
                <span className="whitespace-pre-line text-right text-secondary md:text-left">{activity.notes ?? "—"}</span>
              </td>
              <td className="flex justify-end md:table-cell md:py-0 md:pl-3 md:text-right md:align-middle">
                <form action={deleteActivity.bind(null, activity.id)}>
                  <DeleteActivityButton />
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <FlashNotice />
    </>
  );
}
