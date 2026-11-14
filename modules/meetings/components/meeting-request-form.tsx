"use client";

import { useActionState } from "react";
import { inputClass } from "@/modules/nutritionists/components/profile-fields";
import { requestMeeting, type RequestMeetingState } from "../actions";
import { MEETING_KINDS, MEETING_LIMITS, meetingKindLabel } from "../rules";

export function MeetingRequestForm({ linkId }: { linkId: string }) {
  const [state, formAction, pending] = useActionState<RequestMeetingState, FormData>(
    requestMeeting.bind(null, linkId),
    {},
  );
  const problems = state.problems ?? {};

  return (
    <form action={formAction} className="flex w-full max-w-xl flex-col gap-4">
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium">Type of meeting</legend>
        <div className="flex flex-wrap gap-4">
          {MEETING_KINDS.map((kind, index) => (
            <label key={kind} className="flex items-center gap-2 text-sm">
              <input type="radio" name="kind" value={kind} defaultChecked={index === 0} required />
              {meetingKindLabel(kind)}
            </label>
          ))}
        </div>
      </fieldset>
      <label className="flex flex-col gap-1 text-sm">
        Preferred times
        <input
          name="preferredTimes"
          maxLength={MEETING_LIMITS.preferredTimes}
          placeholder="e.g. weekday evenings"
          className={inputClass}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Message
        <textarea
          name="message"
          rows={3}
          maxLength={MEETING_LIMITS.message}
          placeholder="What would you like to talk about?"
          className={inputClass}
        />
      </label>

      {Object.keys(problems).length > 0 && (
        <ul role="alert" className="list-inside list-disc text-sm text-red-600">
          {Object.entries(problems).map(([field, message]) => (
            <li key={field}>{message}</li>
          ))}
        </ul>
      )}
      {state.error && (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      )}
      {state.saved && (
        <p role="status" className="text-sm text-emerald-700 dark:text-emerald-400">
          Meeting request sent.
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
      >
        {pending ? "Sending…" : "Request meeting"}
      </button>
    </form>
  );
}
