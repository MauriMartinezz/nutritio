"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useLocale } from "@/lib/i18n/client";
import { buttonPrimary, buttonSecondary, fieldError, fieldHint, input, label as labelClass, textarea } from "@/modules/ui/classes";
import { submitCheckIn, type SubmitCheckInState } from "../actions";
import { Segmented } from "@/modules/ui/components/segmented";
import { ButtonLabel } from "@/modules/ui/components/spinner";
import { asQuestion } from "../format";
import { checkInLabels, checkInMessages } from "../messages";
import { CHECK_IN_LIMITS, GYM_PERFORMANCE, RATINGS, measurementField, type MeasurementSite, type RatingField } from "../rules";
import { DietAdherenceSlider } from "./diet-adherence-slider";

const SCORES = [1, 2, 3, 4, 5];
const legend = "mb-2 text-sm font-medium";
/**
 * `askCycle`: the nutritionist asks this client about her menstrual cycle.
 * `measurements`: body measurements the nutritionist asks for, in list order.
 * `cancelHref`: where Cancel goes (e.g. closing the dialog); no Cancel without it.
 */
export function CheckInForm({
  linkId,
  askCycle,
  measurements,
  cancelHref,
}: {
  linkId: string;
  askCycle: boolean;
  measurements: MeasurementSite[];
  cancelHref?: string;
}) {
  const locale = useLocale();
  const t = checkInMessages[locale];
  const labels = checkInLabels[locale];
  const yesNo = [
    { value: "yes", label: labels.yes },
    { value: "no", label: labels.no },
  ];
  const [state, formAction, pending] = useActionState<SubmitCheckInState, FormData>(submitCheckIn, {});
  const problems = state.problems ?? {};
  // React resets the form after the action; these defaults bring a rejected check-in back as it was sent.
  const values = state.values ?? {};

  return (
    <form action={formAction} className="flex w-full flex-col gap-6">
      <input type="hidden" name="linkId" value={linkId} />
      <label className={labelClass}>
        {t.weightKg}
        <input
          name="weightKg"
          inputMode="decimal"
          required
          defaultValue={values.weightKg}
          placeholder={t.weightPlaceholder}
          className={`${input} w-32 font-mono tabular-nums`}
        />
      </label>

      {measurements.length > 0 && (
        <fieldset>
          <legend className={legend}>{t.measurementsCm}</legend>
          <p className={`${fieldHint} mb-2`}>{t.measureHint}</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {measurements.map((site) => (
              <label key={site} className={labelClass}>
                {labels.measurements[site]}
                <input
                  name={measurementField(site)}
                  inputMode="decimal"
                  required
                  defaultValue={values[measurementField(site)]}
                  placeholder="cm"
                  className={`${input} w-28 font-mono tabular-nums`}
                />
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <fieldset>
        <legend className={legend}>{asQuestion(labels.completedWorkouts, locale)}</legend>
        <div className="max-w-xs">
          <Segmented name="completedWorkouts" required options={yesNo} defaultValue={values.completedWorkouts} />
        </div>
      </fieldset>

      <fieldset>
        <legend className={legend}>
          {t.gymPerformance} <span className={fieldHint}>{t.optional}</span>
        </legend>
        <div className="max-w-md">
          <Segmented
            name="gymPerformance"
            defaultValue={values.gymPerformance}
            options={(Object.keys(GYM_PERFORMANCE) as (keyof typeof GYM_PERFORMANCE)[]).map((value) => ({
              value,
              label: labels.gymPerformance[value],
            }))}
          />
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-4">
        <legend className={legend}>{t.howDidItGo}</legend>
        {(Object.keys(RATINGS) as RatingField[]).map((name) => (
          <fieldset key={name} className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-4">
            <legend className="float-left text-sm font-medium sm:w-24">{labels.ratings[name]}</legend>
            <div className="max-w-sm flex-1">
              <Segmented
                name={name}
                required
                defaultValue={values[name]}
                options={SCORES.map((score) => ({ value: String(score), label: String(score) }))}
              />
            </div>
          </fieldset>
        ))}
      </fieldset>

      <DietAdherenceSlider defaultValue={values.dietAdherence ? Number(values.dietAdherence) : undefined} />

      {askCycle && (
        <fieldset>
          <legend className={legend}>{asQuestion(labels.cycleQuestion, locale)}</legend>
          <p className={`${fieldHint} mb-2`}>{t.cycleHint}</p>
          <div className="max-w-xs">
            <Segmented name="menstruating" required options={yesNo} defaultValue={values.menstruating} />
          </div>
        </fieldset>
      )}

      {/* The details field only shows once the box is ticked (CSS :has, works without JS). */}
      <div className="group flex flex-col gap-3">
        <label className="flex min-h-11 items-center gap-3 text-sm font-medium">
          <input
            type="checkbox"
            name="discomfort"
            defaultChecked={values.discomfort === "on"}
            className="size-4 accent-[var(--accent)]" />
          {t.hadDiscomfort}
        </label>
        <label className={`${labelClass} hidden group-has-[input[name=discomfort]:checked]:flex`}>
          {t.discomfortDetails}
          <input
            name="discomfortNotes"
            maxLength={CHECK_IN_LIMITS.discomfortNotes}
            defaultValue={values.discomfortNotes}
            placeholder={t.discomfortPlaceholder}
            className={input}
          />
        </label>
      </div>

      <label className={labelClass}>
        {t.notes}
        <textarea
          name="notes"
          rows={3}
          maxLength={CHECK_IN_LIMITS.notes}
          defaultValue={values.notes}
          placeholder={t.notesPlaceholder}
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

      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={pending} className={buttonPrimary}>
          <ButtonLabel pending={pending} pendingText={t.sending}>
            {t.send}
          </ButtonLabel>
        </button>
        {cancelHref && (
          <Link href={cancelHref} scroll={false} className={buttonSecondary}>
            {t.cancel}
          </Link>
        )}
      </div>
    </form>
  );
}
