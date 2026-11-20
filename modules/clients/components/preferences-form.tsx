"use client";

import { useActionState } from "react";
import { useMessages } from "@/lib/i18n/client";
import {
  buttonPrimary,
  callout,
  card,
  formSuccess,
  input,
  label as labelClass,
  textarea,
} from "@/modules/ui/classes";
import { useActionToast } from "@/modules/ui/components/action-feedback";
import { ButtonLabel } from "@/modules/ui/components/spinner";
import { saveClientPreferences, type SaveClientPreferencesState } from "../actions";
import { preferenceLabels, preferencesFormMessages } from "../messages";
import { COOKING_STYLES, PREFERENCE_LIMITS, type ClientPreferences } from "../preferences";

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
  const t = useMessages(preferencesFormMessages);
  const labels = useMessages(preferenceLabels);
  useActionToast(state, (next) => (next.saved ? { text: t.saved } : null));

  return (
    <form action={formAction} className={`${card} w-full gap-6`}>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-semibold">{t.diet}</legend>
        <Checkboxes flags={labels.flags} values={preferences} />
      </fieldset>

      <label className={labelClass}>
        {t.cookingStyle}
        <select
          name="cookingStyle"
          defaultValue={preferences?.cookingStyle ?? "NO_PREFERENCE"}
          className={input}
        >
          {COOKING_STYLES.map((style) => (
            <option key={style} value={style}>
              {labels.cookingStyles[style]}
            </option>
          ))}
        </select>
      </label>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-semibold">{t.health}</legend>
        <Checkboxes flags={labels.medical} values={preferences} />
      </fieldset>

      <label className={labelClass}>
        {labels.texts.intolerances}
        <input
          name="intolerances"
          maxLength={PREFERENCE_LIMITS.intolerances}
          defaultValue={preferences?.intolerances ?? ""}
          placeholder={t.intolerancesPlaceholder}
          className={input}
        />
      </label>
      <label className={labelClass}>
        {labels.texts.otherConditions}
        <input
          name="otherConditions"
          maxLength={PREFERENCE_LIMITS.otherConditions}
          defaultValue={preferences?.otherConditions ?? ""}
          placeholder={t.otherConditionsPlaceholder}
          className={input}
        />
      </label>
      <label className={labelClass}>
        {labels.texts.notes}
        <textarea
          name="notes"
          rows={4}
          maxLength={PREFERENCE_LIMITS.notes}
          defaultValue={preferences?.notes ?? ""}
          placeholder={t.notesPlaceholder}
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
          {t.saved}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className={`${buttonPrimary} self-start`}
      >
        <ButtonLabel pending={pending} pendingText={t.saving}>
          {t.save}
        </ButtonLabel>
      </button>
    </form>
  );
}
