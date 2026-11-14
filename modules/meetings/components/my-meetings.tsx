import { badge, callout, card, figure, h2, h3, list, muted, type Tone } from "@/modules/ui/classes";
import { getOwnMeetings } from "../dal";
import { meetingKindLabel, meetingStatusLabel } from "../rules";
import { MeetingRequestForm } from "./meeting-request-form";

const STATUS_TONES: Record<string, Tone> = { ACCEPTED: "success", DECLINED: "danger" };

/** The signed-in client's meeting requests, per nutritionist. Render inside <Suspense>. */
export async function MyMeetings() {
  const links = await getOwnMeetings();

  if (links.length === 0) {
    return <p className={muted}>You have no active nutritionist to request a meeting with.</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      {links.map(({ linkId, nutritionistName, requests, hasPending }) => (
        <section key={linkId} className={card}>
          <h2 className={h2}>{nutritionistName}</h2>
          {hasPending ? (
            <p className={callout("warning")}>
              You already have a pending request with this nutritionist. You can ask again once they answer.
            </p>
          ) : (
            <MeetingRequestForm linkId={linkId} />
          )}
          <div className="flex flex-col gap-2 border-t border-divider pt-4">
            <h3 className={h3}>My requests</h3>
            {requests.length === 0 ? (
              <p className={muted}>No meeting requests yet.</p>
            ) : (
              <ul className={list}>
                {requests.map((request) => (
                  <li key={request.id} className="flex flex-col gap-1 py-3 text-sm last:pb-0">
                    <p className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-semibold">{meetingKindLabel(request.kind)}</span>
                      <span className={badge(STATUS_TONES[request.status] ?? "warning")}>
                        {meetingStatusLabel(request.status)}
                      </span>
                    </p>
                    <p className="text-secondary">Requested {request.createdAt.toLocaleDateString()}</p>
                    {request.scheduledFor && (
                      <p>
                        Scheduled for <span className={figure}>{request.scheduledFor.toLocaleString()}</span>
                      </p>
                    )}
                    {request.preferredTimes && <p className="text-secondary">Preferred: {request.preferredTimes}</p>}
                    {request.message && <p className="whitespace-pre-line">{request.message}</p>}
                    {request.responseNote && <p className="text-secondary">Note: {request.responseNote}</p>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      ))}
    </div>
  );
}
