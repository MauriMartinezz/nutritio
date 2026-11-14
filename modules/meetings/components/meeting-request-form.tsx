"use client";

import { useActionState } from "react";
import { buttonPrimary, callout, fieldError, formSuccess, input, label, textarea } from "@/modules/ui/classes";
import { requestMeeting, type RequestMeetingState } from "../actions";
import { MEETING_KINDS, MEETING_LIMITS, meetingKindLabel } from "../rules";

export function MeetingRequestForm({ linkId }: { linkId: string }) {
  const [state, formAction, pending] = useActionState<RequestMeetingState, FormData>(
    requestMeeting.bind(null, linkId),
    {},
  );
  const problems = state.problems ?? {};

  return (
    <form action={formAction} className="flex w-full max-w-xl flex-col gap-5">
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-semibold">Type of meeting</legend>
        <div className="flex flex-wrap gap-x-6">
          {MEETING_KINDS.map((kind, index) => (
            <label key={kind} className="flex min-h-11 items-center gap-3 text-sm">
              <input type="radio" name="kind" value={kind} defaultChecked={index === 0} required className="size-4 accent-accent" />
              {meetingKindLabel(kind)}
            </label>
          ))}
        </div>
      </fieldset>
      <label className={label}>
        Preferred times
        <input
          name="preferredTimes"
          maxLength={MEETING_LIMITS.preferredTimes}
          placeholder="e.g. weekday evenings"
          className={input}
        />
      </label>
      <label className={label}>
        Message
        <textarea
          name="message"
          rows={3}
          maxLength={MEETING_LIMITS.message}
          placeholder="What would you like to talk about?"
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
          Meeting request sent.
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className={`${buttonPrimary} self-start`}
      >
        {pending ? "Sending…" : "Request meeting"}
      </button>
    </form>
  );
}
