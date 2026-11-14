import { getOwnMeetings } from "../dal";
import { meetingKindLabel, meetingStatusLabel } from "../rules";
import { MeetingRequestForm } from "./meeting-request-form";

/** The signed-in client's meeting requests, per nutritionist. Render inside <Suspense>. */
export async function MyMeetings() {
  const links = await getOwnMeetings();

  if (links.length === 0) {
    return (
      <p className="text-sm text-zinc-500">You have no active nutritionist to request a meeting with.</p>
    );
  }

  return (
    <div className="flex flex-col gap-10">
      {links.map(({ linkId, nutritionistName, requests, hasPending }) => (
        <section key={linkId} className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold">{nutritionistName}</h2>
          {hasPending ? (
            <p className="text-sm text-zinc-500">
              You already have a pending request with this nutritionist. You can ask again once they answer.
            </p>
          ) : (
            <MeetingRequestForm linkId={linkId} />
          )}
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold">My requests</h3>
            {requests.length === 0 ? (
              <p className="text-sm text-zinc-500">No meeting requests yet.</p>
            ) : (
              <ul className="flex flex-col divide-y divide-zinc-200 dark:divide-zinc-800">
                {requests.map((request) => (
                  <li key={request.id} className="flex flex-col gap-1 py-3 text-sm">
                    <p className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="font-medium">{meetingKindLabel(request.kind)}</span>
                      <span
                        className={
                          request.status === "ACCEPTED"
                            ? "text-emerald-700 dark:text-emerald-400"
                            : request.status === "DECLINED"
                              ? "text-red-600"
                              : "text-amber-600"
                        }
                      >
                        {meetingStatusLabel(request.status)}
                      </span>
                    </p>
                    <p className="text-zinc-500">Requested {request.createdAt.toLocaleDateString()}</p>
                    {request.scheduledFor && (
                      <p>Scheduled for {request.scheduledFor.toLocaleString()}</p>
                    )}
                    {request.preferredTimes && <p className="text-zinc-500">Preferred: {request.preferredTimes}</p>}
                    {request.message && <p className="whitespace-pre-line">{request.message}</p>}
                    {request.responseNote && (
                      <p className="text-zinc-600 dark:text-zinc-400">Note: {request.responseNote}</p>
                    )}
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
