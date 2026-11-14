import { badge, buttonPrimary, buttonSecondary, card, figure, h2, input, label, list, muted } from "@/modules/ui/classes";
import { respondToMeeting } from "../actions";
import { getNutritionistMeetings } from "../dal";
import { MEETING_LIMITS, meetingKindLabel, toDateTimeLocalValue } from "../rules";

/** Pending meeting requests (accept/decline) and upcoming meetings. Render inside <Suspense>. */
export async function MeetingRequestsSection() {
  const { pending, upcoming, now } = await getNutritionistMeetings();

  return (
    <>
      <section className={card}>
        <h2 className={`${h2} flex flex-wrap items-center gap-2`}>
          Meeting requests{" "}
          <span className={`${badge(pending.length > 0 ? "warning" : "neutral")} font-mono`}>
            ({pending.length})
          </span>
        </h2>
        {pending.length === 0 ? (
          <p className={muted}>No pending meeting requests.</p>
        ) : (
          <ul className={list}>
            {pending.map((request) => (
              <li key={request.id} className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0">
                <div className="flex flex-col gap-1 text-sm">
                  <p className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="text-base font-semibold">{request.client.name}</span>
                    <span className="text-secondary">
                      {meetingKindLabel(request.kind)} · requested {request.createdAt.toLocaleDateString()}
                    </span>
                  </p>
                  {request.preferredTimes && <p className="text-secondary">Preferred: {request.preferredTimes}</p>}
                  {request.message && (
                    <p className="whitespace-pre-line rounded-card bg-surface-muted px-3 py-2">{request.message}</p>
                  )}
                </div>
                <div className="flex flex-wrap items-end gap-x-6 gap-y-4">
                  <form
                    action={respondToMeeting.bind(null, request.id)}
                    className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-end"
                  >
                    <input type="hidden" name="decision" value="accept" />
                    {/* datetime-local has no time zone: the server reads it in its local time. */}
                    <label className={label}>
                      Date and time
                      <input
                        type="datetime-local"
                        name="scheduledFor"
                        required
                        min={toDateTimeLocalValue(now)}
                        className={`${input} font-mono`}
                      />
                    </label>
                    <label className={label}>
                      Note (optional)
                      <input
                        name="responseNote"
                        maxLength={MEETING_LIMITS.responseNote}
                        placeholder="e.g. video link by email"
                        className={input}
                      />
                    </label>
                    <button className={buttonPrimary}>Accept meeting</button>
                  </form>
                  <form
                    action={respondToMeeting.bind(null, request.id)}
                    className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-end"
                  >
                    <input type="hidden" name="decision" value="decline" />
                    <label className={label}>
                      Reason (optional)
                      <input name="responseNote" maxLength={MEETING_LIMITS.responseNote} className={input} />
                    </label>
                    <button className={buttonSecondary}>Decline meeting</button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={card}>
        <h2 className={h2}>Upcoming meetings</h2>
        {upcoming.length === 0 ? (
          <p className={muted}>No upcoming meetings.</p>
        ) : (
          <ul className={list}>
            {upcoming.map((meeting) => (
              <li key={meeting.id} className="flex flex-col gap-1 py-3 text-sm first:pt-0 last:pb-0">
                <p className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-semibold">{meeting.client.name}</span>
                  <span className={figure}>{meeting.scheduledFor?.toLocaleString()}</span>
                </p>
                <p className="text-secondary">{meetingKindLabel(meeting.kind)}</p>
                {meeting.responseNote && <p className="text-secondary">Note: {meeting.responseNote}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
