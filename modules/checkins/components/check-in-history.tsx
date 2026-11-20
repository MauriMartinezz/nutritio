import { getLocale } from "@/lib/i18n/server";
import { formatNumber } from "@/lib/i18n/format";
import { figure, list, muted } from "@/modules/ui/classes";
import type { CheckInView } from "../dal";
import { formatCheckInDate } from "../format";
import { formatCm } from "../measurement-chart";
import { checkInLabels, clientCheckInMessages } from "../messages";
import { RATINGS, type RatingField } from "../rules";
import { formatKg } from "../weight-chart";

/** Check-ins, newest first, for the nutritionist. Server Component. */
export async function CheckInHistory({ checkIns }: { checkIns: CheckInView[] }) {
  const locale = await getLocale();
  const t = clientCheckInMessages[locale];
  const labels = checkInLabels[locale];
  if (checkIns.length === 0) return <p className={muted}>{t.noCheckIns}</p>;
  const yesNo = (value: boolean) => (value ? labels.yes : labels.no).toLowerCase();

  return (
    <ul className={list}>
      {checkIns.map((checkIn) => (
        <li key={checkIn.id} className="flex flex-col gap-1 py-3 text-sm first:pt-0 last:pb-0">
          <p>
            <span className="font-mono font-medium tabular-nums">{formatCheckInDate(checkIn.createdAt, locale)}</span> ·{" "}
            <span className={figure}>{formatKg(checkIn.weightKg, locale)}</span>
            {checkIn.dietAdherence !== null && (
              <>
                {" "}
                · {t.dietFollowed}: <span className={figure}>{formatNumber(checkIn.dietAdherence, locale)}%</span>
              </>
            )}
          </p>
          <p className="text-secondary">
            {[
              `${labels.completedWorkouts}: ${yesNo(checkIn.completedWorkouts)}`,
              ...(checkIn.gymPerformance
                ? [`${t.gymPerformance}: ${labels.gymPerformance[checkIn.gymPerformance].toLowerCase()}`]
                : []),
              ...(Object.keys(RATINGS) as RatingField[]).map((field) => `${labels.ratings[field]}: ${checkIn[field]}/5`),
              ...(checkIn.menstruating === null ? [] : [`${labels.cycleHistory}: ${yesNo(checkIn.menstruating)}`]),
            ].join(" · ")}
          </p>
          {checkIn.measurements.length > 0 && (
            <p>
              <span className="font-medium">{t.measurementsLabel}</span>{" "}
              {checkIn.measurements.map((m, index) => (
                <span key={m.site}>
                  {index > 0 && " · "}
                  {labels.measurements[m.site]} <span className={figure}>{formatCm(m.cm, locale)}</span>
                </span>
              ))}
            </p>
          )}
          {checkIn.discomfort && (
            <p>
              <span className="font-medium">{t.discomfort}</span> {checkIn.discomfortNotes ?? yesNo(true)}
            </p>
          )}
          {checkIn.notes && <p className="whitespace-pre-line">{checkIn.notes}</p>}
        </li>
      ))}
    </ul>
  );
}
