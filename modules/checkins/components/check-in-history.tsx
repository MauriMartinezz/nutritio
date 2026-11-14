import { RATINGS, type RatingField } from "../rules";
import type { CheckInView } from "../dal";

/** Check-ins, newest first. Plain markup, so it renders on server and client. */
export function CheckInHistory({ checkIns }: { checkIns: CheckInView[] }) {
  if (checkIns.length === 0) return <p className="text-sm text-zinc-500">No check-ins yet.</p>;

  return (
    <ul className="flex flex-col divide-y divide-zinc-200 dark:divide-zinc-800">
      {checkIns.map((checkIn) => (
        <li key={checkIn.id} className="flex flex-col gap-1 py-3 text-sm">
          <p>
            <span className="font-medium">{checkIn.createdAt.toLocaleDateString()}</span> ·{" "}
            {checkIn.weightKg} kg
          </p>
          <p className="text-zinc-600 dark:text-zinc-400">
            {(Object.entries(RATINGS) as [RatingField, string][])
              .map(([field, label]) => `${label}: ${checkIn[field]}/5`)
              .join(" · ")}
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
