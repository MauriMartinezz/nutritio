"use client";

import { useActionState } from "react";
import { inputClass } from "@/modules/nutritionists/components/profile-fields";
import { submitCheckIn, type SubmitCheckInState } from "../actions";
import { CHECK_IN_LIMITS, RATINGS } from "../rules";

const SCORES = [1, 2, 3, 4, 5];

export function CheckInForm({ linkId }: { linkId: string }) {
  const [state, formAction, pending] = useActionState<SubmitCheckInState, FormData>(
    submitCheckIn.bind(null, linkId),
    {},
  );
  const problems = state.problems ?? {};

  return (
    <form action={formAction} className="flex w-full max-w-xl flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        Weight (kg)
        <input
          name="weightKg"
          inputMode="decimal"
          required
          placeholder="e.g. 72.5"
          className={`${inputClass} w-32`}
        />
      </label>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium">How did it go? (1 = bad, 5 = great)</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {Object.entries(RATINGS).map(([name, label]) => (
            <label key={name} className="flex flex-col gap-1 text-sm">
              {label}
              <select name={name} required defaultValue="" className={inputClass}>
                <option value="" disabled>
                  Choose…
                </option>
                {SCORES.map((score) => (
                  <option key={score} value={score}>
                    {score}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
      </fieldset>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="discomfort" />
        I had some discomfort or pain
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Discomfort details
        <input
          name="discomfortNotes"
          maxLength={CHECK_IN_LIMITS.discomfortNotes}
          placeholder="Where and when (only if you had discomfort)"
          className={inputClass}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Notes
        <textarea
          name="notes"
          rows={3}
          maxLength={CHECK_IN_LIMITS.notes}
          placeholder="Anything your nutritionist should know"
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
          Check-in sent.
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
      >
        {pending ? "Sending…" : "Send check-in"}
      </button>
    </form>
  );
}
