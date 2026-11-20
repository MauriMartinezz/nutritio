"use client";

import { useActionState } from "react";
import { useLocale, useMessages } from "@/lib/i18n/client";
import { buttonPrimary, callout, fieldError, formSuccess, input, label, textarea } from "@/modules/ui/classes";
import { ButtonLabel } from "@/modules/ui/components/spinner";
import { requestMeeting, type RequestMeetingState } from "../actions";
import { meetingMessages } from "../messages";
import { MEETING_KINDS, MEETING_LIMITS, meetingKindLabel } from "../rules";

export function MeetingRequestForm({ linkId }: { linkId: string }) {
  const t = useMessages(meetingMessages);
  const locale = useLocale();
  const [state, formAction, pending] = useActionState<RequestMeetingState, FormData>(requestMeeting, {});
  const problems = state.problems ?? {};

  return (
    <form action={formAction} className="flex w-full max-w-xl flex-col gap-5">
      <input type="hidden" name="linkId" value={linkId} />
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-semibold">{t.typeOfMeeting}</legend>
        <div className="flex flex-wrap gap-x-6">
          {MEETING_KINDS.map((kind, index) => (
            <label key={kind} className="flex min-h-11 items-center gap-3 text-sm">
              <input type="radio" name="kind" value={kind} defaultChecked={index === 0} required className="size-4 accent-accent" />
              {meetingKindLabel(kind, locale)}
            </label>
          ))}
        </div>
      </fieldset>
      <label className={label}>
        {t.preferredTimes}
        <input
          name="preferredTimes"
          maxLength={MEETING_LIMITS.preferredTimes}
          placeholder={t.preferredTimesPlaceholder}
          className={input}
        />
      </label>
      <label className={label}>
        {t.message}
        <textarea
          name="message"
          rows={3}
          maxLength={MEETING_LIMITS.message}
          placeholder={t.messagePlaceholder}
          className={textarea}
        />
      </label>

      {Object.keys(problems).length > 0 && (
        <ul role="alert" className={`${callout("danger")} list-inside list-disc`}>
          {Object.entries(problems).map(([field, message]) => (
            <li key={field}>{message}</li>
          ))}
        </ul>
      )}
      {state.error && (
        <p role="alert" className={fieldError}>
          {state.error}
        </p>
      )}
      {state.saved && (
        <p role="status" className={formSuccess}>
          {t.sent}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className={`${buttonPrimary} self-start`}
      >
        <ButtonLabel pending={pending} pendingText={t.sending}>
          {t.request}
        </ButtonLabel>
      </button>
    </form>
  );
}
