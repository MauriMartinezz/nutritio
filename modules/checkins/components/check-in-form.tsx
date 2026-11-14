"use client";

import { useActionState } from "react";
import { buttonPrimary, fieldError, formSuccess, input, label as labelClass, textarea } from "@/modules/ui/classes";
import { submitCheckIn, type SubmitCheckInState } from "../actions";
import { CHECK_IN_LIMITS, RATINGS } from "../rules";
import { DietAdherenceSlider } from "./diet-adherence-slider";

const SCORES = [1, 2, 3, 4, 5];

export function CheckInForm({ linkId }: { linkId: string }) {
  const [state, formAction, pending] = useActionState<SubmitCheckInState, FormData>(
    submitCheckIn.bind(null, linkId),
    {},
  );
  const problems = state.problems ?? {};

  return (
    <form action={formAction} className="flex w-full flex-col gap-5">
      <label className={labelClass}>
        Weight (kg)
        <input
          name="weightKg"
          inputMode="decimal"
          required
          placeholder="e.g. 72.5"
          className={`${input} w-32 font-mono tabular-nums`}
        />
      </label>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-semibold">How did it go? (1 = bad, 5 = great)</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {Object.entries(RATINGS).map(([name, label]) => (
            <label key={name} className={labelClass}>
              {label}
              <select name={name} required defaultValue="" className={input}>
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

      <DietAdherenceSlider />

      <label className="flex min-h-11 items-center gap-3 text-sm font-medium">
        <input type="checkbox" name="discomfort" className="size-4 accent-[var(--accent)]" />
        I had some discomfort or pain
      </label>
      <label className={labelClass}>
        Discomfort details
        <input
          name="discomfortNotes"
          maxLength={CHECK_IN_LIMITS.discomfortNotes}
          placeholder="Where and when (only if you had discomfort)"
          className={input}
        />
      </label>
      <label className={labelClass}>
        Notes
        <textarea
          name="notes"
          rows={3}
          maxLength={CHECK_IN_LIMITS.notes}
          placeholder="Anything your nutritionist should know"
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
      {state.error && (
        <p role="alert" className={fieldError}>
          {state.error}
        </p>
      )}
      {state.saved && (
        <p role="status" className={formSuccess}>
          Check-in sent.
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className={`${buttonPrimary} self-start`}
      >
        {pending ? "Sending…" : "Send check-in"}
      </button>
    </form>
  );
}
