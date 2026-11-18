"use client";

import { useActionState } from "react";
import {
  buttonPrimary,
  callout,
  card,
  formSuccess,
  input,
  label as labelClass,
  textarea,
} from "@/modules/ui/classes";
import { Segmented } from "@/modules/ui/components/segmented";
import { saveClientPreferences, type SaveClientPreferencesState } from "../actions";
import {
  COOKING_STYLES,
  COOKING_STYLE_LABELS,
  MEDICAL_FLAGS,
  PREFERENCE_FLAGS,
  PREFERENCE_LIMITS,
  SEX_LABELS,
  type ClientPreferences,
} from "../preferences";

function Checkboxes({
  flags,
  values,
}: {
  flags: Record<string, string>;
  values: ClientPreferences | null;
}) {
  return (
    <div className="grid gap-x-6 sm:grid-cols-2">
      {Object.entries(flags).map(([name, label]) => (
        <label key={name} className="flex min-h-11 items-center gap-3 text-sm">
          <input
            type="checkbox"
            name={name}
            defaultChecked={values?.[name as keyof ClientPreferences] === true}
            className="size-4 accent-accent"
          />
          {label}
        </label>
      ))}
    </div>
  );
}

export function PreferencesForm({ preferences }: { preferences: ClientPreferences | null }) {
  const [state, formAction, pending] = useActionState<SaveClientPreferencesState, FormData>(
    saveClientPreferences,
    {},
  );
  const problems = state.problems ?? {};

  return (
    <form action={formAction} className={`${card} w-full gap-6`}>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-semibold">I am a</legend>
        <div className="max-w-xs">
          <Segmented
            name="sex"
            required
            defaultValue={preferences?.sex}
            options={Object.entries(SEX_LABELS).map(([value, label]) => ({ value, label }))}
          />
        </div>
        <p className="text-xs text-secondary">
          Women and men have different needs; your nutritionist may also ask about your menstrual cycle.
        </p>
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-semibold">Diet</legend>
        <Checkboxes flags={PREFERENCE_FLAGS} values={preferences} />
      </fieldset>

      <label className={labelClass}>
        Cooking style
        <select
          name="cookingStyle"
          defaultValue={preferences?.cookingStyle ?? "NO_PREFERENCE"}
          className={input}
        >
          {COOKING_STYLES.map((style) => (
            <option key={style} value={style}>
              {COOKING_STYLE_LABELS[style]}
            </option>
          ))}
        </select>
      </label>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-semibold">Health</legend>
        <Checkboxes flags={MEDICAL_FLAGS} values={preferences} />
      </fieldset>

      <label className={labelClass}>
        Intolerances
        <input
          name="intolerances"
          maxLength={PREFERENCE_LIMITS.intolerances}
          defaultValue={preferences?.intolerances ?? ""}
          placeholder="e.g. lactose, walnuts"
          className={input}
        />
      </label>
      <label className={labelClass}>
        Other conditions
        <input
          name="otherConditions"
          maxLength={PREFERENCE_LIMITS.otherConditions}
          defaultValue={preferences?.otherConditions ?? ""}
          placeholder="Anything else your nutritionist should know"
          className={input}
        />
      </label>
      <label className={labelClass}>
        Notes
        <textarea
          name="notes"
          rows={4}
          maxLength={PREFERENCE_LIMITS.notes}
          defaultValue={preferences?.notes ?? ""}
          placeholder="Foods you dislike, schedule, goals…"
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
      {state.saved && (
        <p role="status" className={formSuccess}>
          Preferences saved.
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className={`${buttonPrimary} self-start`}
      >
        {pending ? "Saving…" : "Save preferences"}
      </button>
    </form>
  );
}
