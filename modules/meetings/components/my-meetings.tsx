import { formatDateTime } from "@/lib/i18n/format";
import { getLocale, getMessages } from "@/lib/i18n/server";
import { badge, callout, card, figure, h2, h3, list, muted, type Tone } from "@/modules/ui/classes";
import { getOwnMeetings } from "../dal";
import { meetingMessages } from "../messages";
import { meetingKindLabel, meetingStatusLabel } from "../rules";
import { MeetingRequestForm } from "./meeting-request-form";

const STATUS_TONES: Record<string, Tone> = { ACCEPTED: "success", DECLINED: "danger" };

/** The signed-in client's meeting requests, per nutritionist. Render inside <Suspense>. */
export async function MyMeetings() {
  const [links, t, locale] = await Promise.all([getOwnMeetings(), getMessages(meetingMessages), getLocale()]);

  if (links.length === 0) {
    return <p className={muted}>{t.noNutritionist}</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      {links.map(({ linkId, nutritionistName, requests, hasPending }) => (
        <section key={linkId} className={card}>
          <h2 className={h2}>{nutritionistName}</h2>
          {hasPending ? (
            <p className={callout("warning")}>
              {t.pendingNotice}
            </p>
          ) : (
            <MeetingRequestForm linkId={linkId} />
          )}
          <div className="flex flex-col gap-2 border-t border-divider pt-4">
            <h3 className={h3}>{t.myRequests}</h3>
            {requests.length === 0 ? (
              <p className={muted}>{t.noRequests}</p>
            ) : (
              <ul className={list}>
                {requests.map((request) => (
                  <li key={request.id} className="flex flex-col gap-1 py-3 text-sm last:pb-0">
                    <p className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-semibold">{meetingKindLabel(request.kind, locale)}</span>
                      <span className={badge(STATUS_TONES[request.status] ?? "warning")}>
                        {meetingStatusLabel(request.status, locale)}
                      </span>
                    </p>
                    <p className="text-secondary">{t.requestedOn(formatDateTime(request.createdAt, locale, { dateStyle: "short", timeStyle: undefined }))}</p>
                    {request.scheduledFor && (
                      <p>
                        {t.scheduledFor} <span className={figure}>{formatDateTime(request.scheduledFor, locale)}</span>
                      </p>
                    )}
                    {request.preferredTimes && <p className="text-secondary">{t.preferred(request.preferredTimes)}</p>}
                    {request.message && <p className="whitespace-pre-line">{request.message}</p>}
                    {request.responseNote && <p className="text-secondary">{t.note(request.responseNote)}</p>}
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
