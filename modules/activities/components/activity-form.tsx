"use client";

import { useActionState } from "react";
import { inputClass } from "@/modules/nutritionists/components/profile-fields";
import { logActivity, type LogActivityState } from "../actions";
import { ACTIVITY_LIMITS, ACTIVITY_TYPES, INTENSITIES } from "../rules";

/** `today` and `earliest` are "YYYY-MM-DD" (the server's calendar day). */
export function ActivityForm({ today, earliest }: { today: string; earliest: string }) {
  const [state, formAction, pending] = useActionState<LogActivityState, FormData>(logActivity, {});
  const problems = state.problems ?? {};

  return (
    <form action={formAction} className="flex w-full max-w-xl flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          Activity
          <select name="type" required defaultValue="" className={inputClass}>
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
        <label className="flex flex-col gap-1 text-sm">
          Name (only for Other)
          <input
            name="customName"
            maxLength={ACTIVITY_LIMITS.customName}
            placeholder="e.g. Padel"
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Date
          <input
            type="date"
            name="performedOn"
            required
            defaultValue={today}
            min={earliest}
            max={today}
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Duration (minutes)
          <input
            type="number"
            name="durationMinutes"
            required
            min={ACTIVITY_LIMITS.minDurationMinutes}
            max={ACTIVITY_LIMITS.maxDurationMinutes}
            step={1}
            placeholder="e.g. 60"
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Intensity
          <select name="intensity" required defaultValue="MEDIUM" className={inputClass}>
            {Object.entries(INTENSITIES).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="flex flex-col gap-1 text-sm">
        Notes
        <textarea
          name="notes"
          rows={2}
          maxLength={ACTIVITY_LIMITS.notes}
          placeholder="Optional: what you did, how you felt"
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
      {state.saved && (
        <p role="status" className="text-sm text-emerald-700 dark:text-emerald-400">
          Activity logged.
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
      >
        {pending ? "Saving…" : "Log activity"}
      </button>
    </form>
  );
}
