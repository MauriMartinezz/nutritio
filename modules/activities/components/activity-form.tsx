"use client";

import { useActionState } from "react";
import { buttonPrimary, fieldError, formSuccess, input, label, textarea } from "@/modules/ui/classes";
import { logActivity, type LogActivityState } from "../actions";
import { ACTIVITY_LIMITS, ACTIVITY_TYPES, INTENSITIES } from "../rules";

/** `today` and `earliest` are "YYYY-MM-DD" (the server's calendar day). */
export function ActivityForm({ today, earliest }: { today: string; earliest: string }) {
  const [state, formAction, pending] = useActionState<LogActivityState, FormData>(logActivity, {});
  const problems = state.problems ?? {};

  return (
    <form action={formAction} className="flex w-full flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className={label}>
          Activity
          <select name="type" required defaultValue="" className={input}>
            <option value="" disabled>
              Choose…
            </option>
            {Object.entries(ACTIVITY_TYPES).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className={label}>
          Name (only for Other)
          <input
            name="customName"
            maxLength={ACTIVITY_LIMITS.customName}
            placeholder="e.g. Padel"
            className={input}
          />
        </label>
        <label className={label}>
          Date
          <input
            type="date"
            name="performedOn"
            required
            defaultValue={today}
            min={earliest}
            max={today}
            className={input}
          />
        </label>
        <label className={label}>
          Duration (minutes)
          <input
            type="number"
            name="durationMinutes"
            required
            min={ACTIVITY_LIMITS.minDurationMinutes}
            max={ACTIVITY_LIMITS.maxDurationMinutes}
            step={1}
            placeholder="e.g. 60"
            className={input}
          />
        </label>
        <label className={label}>
          Intensity
          <select name="intensity" required defaultValue="MEDIUM" className={input}>
            {Object.entries(INTENSITIES).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className={label}>
        Notes
        <textarea
          name="notes"
          rows={2}
          maxLength={ACTIVITY_LIMITS.notes}
          placeholder="Optional: what you did, how you felt"
          className={textarea}
        />
      </label>

      {Object.keys(problems).length > 0 && (
        <ul role="alert" className={`list-inside list-disc ${fieldError}`}>
          {Object.entries(problems).map(([field, message]) => (
            <li key={field}>{message}</li>
          ))}
        </ul>
      )}
      {state.saved && (
        <p role="status" className={formSuccess}>
          Activity logged.
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className={`${buttonPrimary} self-start`}
      >
        {pending ? "Saving…" : "Log activity"}
      </button>
    </form>
  );
}
