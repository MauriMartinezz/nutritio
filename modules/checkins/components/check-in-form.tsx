"use client";

import { useActionState } from "react";
import { buttonPrimary, fieldError, fieldHint, input, label as labelClass, textarea } from "@/modules/ui/classes";
import { submitCheckIn, type SubmitCheckInState } from "../actions";
import { CHECK_IN_LIMITS, COMPLETED_WORKOUTS_LABEL, GYM_PERFORMANCE, RATINGS } from "../rules";
import { DietAdherenceSlider } from "./diet-adherence-slider";

const SCORES = [1, 2, 3, 4, 5];
const legend = "mb-2 text-sm font-medium";
/** Radio rendered as one segment of a button group (the input stays focusable). */
const segment =
  "flex min-h-11 flex-1 cursor-pointer items-center justify-center px-3 text-sm font-medium text-secondary has-[:checked]:bg-accent has-[:checked]:text-on-accent has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent hover:text-ink";
const group = "flex divide-x divide-line overflow-hidden rounded-control border border-line-strong bg-surface";

function Segmented({
  name,
  options,
  required,
}: {
  name: string;
  options: { value: string; label: string }[];
  required?: boolean;
}) {
  return (
    <div className={group}>
      {options.map((option) => (
        <label key={option.value} className={segment}>
          <input type="radio" name={name} value={option.value} required={required} className="sr-only" />
          {option.label}
        </label>
      ))}
    </div>
  );
}

export function CheckInForm({ linkId }: { linkId: string }) {
  const [state, formAction, pending] = useActionState<SubmitCheckInState, FormData>(
    submitCheckIn.bind(null, linkId),
    {},
  );
  const problems = state.problems ?? {};

  return (
    <form action={formAction} className="flex w-full flex-col gap-6">
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

      <fieldset>
        <legend className={legend}>{COMPLETED_WORKOUTS_LABEL}?</legend>
        <div className="max-w-xs">
          <Segmented
            name="completedWorkouts"
            required
            options={[
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
            ]}
          />
        </div>
      </fieldset>

      <fieldset>
        <legend className={legend}>
          Gym performance <span className={fieldHint}>(optional)</span>
        </legend>
        <div className="max-w-md">
          <Segmented
            name="gymPerformance"
            options={Object.entries(GYM_PERFORMANCE).map(([value, label]) => ({ value, label }))}
          />
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-4">
        <legend className={legend}>How did it go? (1 = bad, 5 = great)</legend>
        {Object.entries(RATINGS).map(([name, label]) => (
          <fieldset key={name} className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-4">
            <legend className="float-left text-sm font-medium sm:w-24">{label}</legend>
            <div className="max-w-sm flex-1">
              <Segmented name={name} required options={SCORES.map((score) => ({ value: String(score), label: String(score) }))} />
            </div>
          </fieldset>
        ))}
      </fieldset>

      <DietAdherenceSlider />

      {/* The details field only shows once the box is ticked (CSS :has, works without JS). */}
      <div className="group flex flex-col gap-3">
        <label className="flex min-h-11 items-center gap-3 text-sm font-medium">
          <input type="checkbox" name="discomfort" className="size-4 accent-[var(--accent)]" />
          I had some discomfort or pain
        </label>
        <label className={`${labelClass} hidden group-has-[input[name=discomfort]:checked]:flex`}>
          Discomfort details
          <input
            name="discomfortNotes"
            maxLength={CHECK_IN_LIMITS.discomfortNotes}
            placeholder="Where and when"
            className={input}
          />
        </label>
      </div>

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

      <button type="submit" disabled={pending} className={`${buttonPrimary} self-start`}>
        {pending ? "Sending…" : "Send check-in"}
      </button>
    </form>
  );
}
