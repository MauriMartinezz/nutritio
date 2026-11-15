"use client";

import { useActionState } from "react";
import { buttonPrimary, fieldError, fieldHint, input, label as labelClass, textarea } from "@/modules/ui/classes";
import { submitCheckIn, type SubmitCheckInState } from "../actions";
import { Segmented, YES_NO } from "@/modules/ui/components/segmented";
import {
  CHECK_IN_LIMITS,
  COMPLETED_WORKOUTS_LABEL,
  CYCLE_QUESTION,
  GYM_PERFORMANCE,
  MEASUREMENTS,
  RATINGS,
  measurementField,
  type MeasurementSite,
} from "../rules";
import { DietAdherenceSlider } from "./diet-adherence-slider";

const SCORES = [1, 2, 3, 4, 5];
const legend = "mb-2 text-sm font-medium";
/**
 * `askCycle`: the nutritionist asks this client about her menstrual cycle.
 * `measurements`: body measurements the nutritionist asks for, in list order.
 */
export function CheckInForm({
  linkId,
  askCycle,
  measurements,
}: {
  linkId: string;
  askCycle: boolean;
  measurements: MeasurementSite[];
}) {
  const [state, formAction, pending] = useActionState<SubmitCheckInState, FormData>(submitCheckIn, {});
  const problems = state.problems ?? {};

  return (
    <form action={formAction} className="flex w-full flex-col gap-6">
      <input type="hidden" name="linkId" value={linkId} />
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

      {measurements.length > 0 && (
        <fieldset>
          <legend className={legend}>Measurements (cm)</legend>
          <p className={`${fieldHint} mb-2`}>Measure with a tape, relaxed, at the same time of day each check-in.</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {measurements.map((site) => (
              <label key={site} className={labelClass}>
                {MEASUREMENTS[site]}
                <input
                  name={measurementField(site)}
                  inputMode="decimal"
                  required
                  placeholder="cm"
                  className={`${input} w-28 font-mono tabular-nums`}
                />
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <fieldset>
        <legend className={legend}>{COMPLETED_WORKOUTS_LABEL}?</legend>
        <div className="max-w-xs">
          <Segmented name="completedWorkouts" required options={YES_NO} />
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

      {askCycle && (
        <fieldset>
          <legend className={legend}>{CYCLE_QUESTION}?</legend>
          <p className={`${fieldHint} mb-2`}>It can change your weight, energy and performance.</p>
          <div className="max-w-xs">
            <Segmented name="menstruating" required options={YES_NO} />
          </div>
        </fieldset>
      )}

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
