"use client";

import { useActionState } from "react";
import { inputClass } from "@/modules/nutritionists/components/profile-fields";
import { saveClientPreferences, type SaveClientPreferencesState } from "../actions";
import {
  COOKING_STYLES,
  COOKING_STYLE_LABELS,
  MEDICAL_FLAGS,
  PREFERENCE_FLAGS,
  PREFERENCE_LIMITS,
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
    <div className="flex flex-wrap gap-x-6 gap-y-2">
      {Object.entries(flags).map(([name, label]) => (
        <label key={name} className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name={name}
            defaultChecked={values?.[name as keyof ClientPreferences] === true}
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
    <form action={formAction} className="flex w-full max-w-xl flex-col gap-5">
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium">Diet</legend>
        <Checkboxes flags={PREFERENCE_FLAGS} values={preferences} />
      </fieldset>

      <label className="flex flex-col gap-1 text-sm">
        Cooking style
        <select
          name="cookingStyle"
          defaultValue={preferences?.cookingStyle ?? "NO_PREFERENCE"}
          className={inputClass}
        >
          {COOKING_STYLES.map((style) => (
            <option key={style} value={style}>
              {COOKING_STYLE_LABELS[style]}
            </option>
          ))}
        </select>
      </label>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium">Health</legend>
        <Checkboxes flags={MEDICAL_FLAGS} values={preferences} />
      </fieldset>

      <label className="flex flex-col gap-1 text-sm">
        Intolerances
        <input
          name="intolerances"
          maxLength={PREFERENCE_LIMITS.intolerances}
          defaultValue={preferences?.intolerances ?? ""}
          placeholder="e.g. lactose, walnuts"
          className={inputClass}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Other conditions
        <input
          name="otherConditions"
          maxLength={PREFERENCE_LIMITS.otherConditions}
          defaultValue={preferences?.otherConditions ?? ""}
          placeholder="Anything else your nutritionist should know"
          className={inputClass}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Notes
        <textarea
          name="notes"
          rows={4}
          maxLength={PREFERENCE_LIMITS.notes}
          defaultValue={preferences?.notes ?? ""}
          placeholder="Foods you dislike, schedule, goals…"
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
          Preferences saved.
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save preferences"}
      </button>
    </form>
  );
}
