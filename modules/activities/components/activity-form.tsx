"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useLocale, useMessages } from "@/lib/i18n/client";
import { buttonPrimary, buttonSecondary, fieldError, formSuccess, input, label, textarea } from "@/modules/ui/classes";
import { ButtonLabel } from "@/modules/ui/components/spinner";
import { logActivity, type LogActivityState } from "../actions";
import { activityMessages } from "../messages";
import { ACTIVITY_LIMITS, ACTIVITY_TYPES, INTENSITIES, activityTypeLabel, intensityLabel } from "../rules";

const TYPES = Object.keys(ACTIVITY_TYPES) as (keyof typeof ACTIVITY_TYPES)[];
const LEVELS = Object.keys(INTENSITIES) as (keyof typeof INTENSITIES)[];

/**
 * `today` and `earliest` are "YYYY-MM-DD" (the server's calendar day). With
 * `doneHref`, a saved activity offers a "Done" link (e.g. to close a dialog).
 */
export function ActivityForm({ today, earliest, doneHref }: { today: string; earliest: string; doneHref?: string }) {
  const t = useMessages(activityMessages);
  const locale = useLocale();
  const [state, formAction, pending] = useActionState<LogActivityState, FormData>(logActivity, {});
  const problems = state.problems ?? {};

  return (
    <form action={formAction} className="flex w-full flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className={label}>
          {t.typeLabel}
          <select name="type" required defaultValue="" className={input}>
            <option value="" disabled>
              {t.choose}
            </option>
            {TYPES.map((type) => (
              <option key={type} value={type}>
                {activityTypeLabel(type, locale)}
              </option>
            ))}
          </select>
        </label>
        <label className={label}>
          {t.customName}
          <input
            name="customName"
            maxLength={ACTIVITY_LIMITS.customName}
            placeholder={t.customNamePlaceholder}
            className={input}
          />
        </label>
        <label className={label}>
          {t.dateLabel}
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
          {t.durationLabel}
          <input
            type="number"
            name="durationMinutes"
            required
            min={ACTIVITY_LIMITS.minDurationMinutes}
            max={ACTIVITY_LIMITS.maxDurationMinutes}
            step={1}
            placeholder={t.durationPlaceholder}
            className={input}
          />
        </label>
        <label className={label}>
          {t.intensityField}
          <select name="intensity" required defaultValue="MEDIUM" className={input}>
            {LEVELS.map((level) => (
              <option key={level} value={level}>
                {intensityLabel(level, locale)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className={label}>
        {t.notesField}
        <textarea
          name="notes"
          rows={2}
          maxLength={ACTIVITY_LIMITS.notes}
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
      {state.saved && (
        <p role="status" className={formSuccess}>
          {t.saved}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={pending} className={buttonPrimary}>
          <ButtonLabel pending={pending} pendingText={t.saving}>
            {t.logActivity}
          </ButtonLabel>
        </button>
        {state.saved && doneHref && (
          <Link href={doneHref} scroll={false} className={buttonSecondary}>
            {t.done}
          </Link>
        )}
      </div>
    </form>
  );
}
