import { inputClass } from "@/modules/nutritionists/components/profile-fields";
import { respondToMeeting } from "../actions";
import { getNutritionistMeetings } from "../dal";
import { MEETING_LIMITS, meetingKindLabel, toDateTimeLocalValue } from "../rules";

const button =
  "rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900";

/** Pending meeting requests (accept/decline) and upcoming meetings. Render inside <Suspense>. */
export async function MeetingRequestsSection() {
  const { pending, upcoming, now } = await getNutritionistMeetings();

  return (
    <>
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">
          Meeting requests <span className="text-zinc-500">({pending.length})</span>
        </h2>
        {pending.length === 0 ? (
          <p className="text-sm text-zinc-500">No pending meeting requests.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-zinc-200 dark:divide-zinc-800">
            {pending.map((request) => (
              <li key={request.id} className="flex flex-col gap-3 py-3">
                <div className="flex flex-col gap-1 text-sm">
                  <p className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="text-base font-medium">{request.client.name}</span>
                    <span className="text-zinc-500">
                      {meetingKindLabel(request.kind)} · requested {request.createdAt.toLocaleDateString()}
                    </span>
                  </p>
                  {request.preferredTimes && <p className="text-zinc-500">Preferred: {request.preferredTimes}</p>}
                  {request.message && <p className="whitespace-pre-line">{request.message}</p>}
                </div>
                <div className="flex flex-wrap items-end gap-4">
                  <form action={respondToMeeting.bind(null, request.id)} className="flex flex-wrap items-end gap-2">
                    <input type="hidden" name="decision" value="accept" />
                    {/* datetime-local has no time zone: the server reads it in its local time. */}
                    <label className="flex flex-col gap-1 text-sm">
                      Date and time
                      <input
                        type="datetime-local"
                        name="scheduledFor"
                        required
                        min={toDateTimeLocalValue(now)}
                        className={inputClass}
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-sm">
                      Note (optional)
                      <input
                        name="responseNote"
                        maxLength={MEETING_LIMITS.responseNote}
                        placeholder="e.g. video link by email"
                        className={inputClass}
                      />
                    </label>
                    <button className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm text-white hover:bg-emerald-700">
                      Accept meeting
                    </button>
                  </form>
                  <form action={respondToMeeting.bind(null, request.id)} className="flex flex-wrap items-end gap-2">
                    <input type="hidden" name="decision" value="decline" />
                    <label className="flex flex-col gap-1 text-sm">
                      Reason (optional)
                      <input name="responseNote" maxLength={MEETING_LIMITS.responseNote} className={inputClass} />
                    </label>
                    <button className={button}>Decline meeting</button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Upcoming meetings</h2>
        {upcoming.length === 0 ? (
          <p className="text-sm text-zinc-500">No upcoming meetings.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-zinc-200 dark:divide-zinc-800">
            {upcoming.map((meeting) => (
              <li key={meeting.id} className="flex flex-col gap-1 py-3 text-sm">
                <p className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-medium">{meeting.client.name}</span>
                  <span>{meeting.scheduledFor?.toLocaleString()}</span>
                </p>
                <p className="text-zinc-500">{meetingKindLabel(meeting.kind)}</p>
                {meeting.responseNote && (
                  <p className="text-zinc-600 dark:text-zinc-400">Note: {meeting.responseNote}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
