import { COMPLETED_WORKOUTS_LABEL, GYM_PERFORMANCE, RATINGS, type RatingField } from "../rules";
import type { CheckInView } from "../dal";
import { figure, list, muted } from "@/modules/ui/classes";

/** Check-ins, newest first. Plain markup, so it renders on server and client. */
export function CheckInHistory({ checkIns }: { checkIns: CheckInView[] }) {
  if (checkIns.length === 0) return <p className={muted}>No check-ins yet.</p>;

  return (
    <ul className={list}>
      {checkIns.map((checkIn) => (
        <li key={checkIn.id} className="flex flex-col gap-1 py-3 text-sm first:pt-0 last:pb-0">
          <p>
            <span className="font-mono font-medium tabular-nums">{checkIn.createdAt.toLocaleDateString()}</span> ·{" "}
            <span className={figure}>{checkIn.weightKg} kg</span>
            {checkIn.dietAdherence !== null && (
              <>
                {" "}
                · Diet followed: <span className={figure}>{checkIn.dietAdherence}%</span>
              </>
            )}
          </p>
          <p className="text-secondary">
            {[
              `${COMPLETED_WORKOUTS_LABEL}: ${checkIn.completedWorkouts ? "yes" : "no"}`,
              ...(checkIn.gymPerformance ? [`Gym performance: ${GYM_PERFORMANCE[checkIn.gymPerformance].toLowerCase()}`] : []),
              ...(Object.entries(RATINGS) as [RatingField, string][]).map(
                ([field, label]) => `${label}: ${checkIn[field]}/5`,
              ),
            ].join(" · ")}
          </p>
          {checkIn.discomfort && (
            <p>
              <span className="font-medium">Discomfort:</span> {checkIn.discomfortNotes ?? "yes"}
            </p>
          )}
          {checkIn.notes && <p className="whitespace-pre-line">{checkIn.notes}</p>}
        </li>
      ))}
    </ul>
  );
}
