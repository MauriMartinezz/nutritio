"use client";

import { useActionState } from "react";
import { useMessages } from "@/lib/i18n/client";
import {
  buttonDanger,
  buttonPrimary,
  buttonSecondary,
  callout,
  fieldHint,
  formSuccess,
  h3,
  label,
  textarea,
} from "@/modules/ui/classes";
import { SubmitButton, useActionToast } from "@/modules/ui/components/action-feedback";
import { reviewNutritionist, type ReviewNutritionistState } from "../actions";
import { REVIEW_NOTE_MAX } from "../verification";
import { nutritionistMessages } from "../messages";
import { ProfileFields, inputClass, type ProfileFieldValues } from "./profile-fields";

export type ReviewableNutritionist = ProfileFieldValues & {
  id: string;
  name: string;
  email: string;
  note: string | null;
};

/** Correct the application, leave a note and decide. Buttons sit at the bottom of the panel. */
export function ReviewForm({ nutritionist }: { nutritionist: ReviewableNutritionist }) {
  const [state, formAction] = useActionState<ReviewNutritionistState, FormData>(reviewNutritionist, {});
  const problems = state.problems ?? {};
  const t = useMessages(nutritionistMessages);
  const savedMessages = { APPROVED: t.savedApproved, REJECTED: t.savedRejected, PENDING: t.savedPending };
  useActionToast(state, (next) =>
    next.saved ? { text: savedMessages[next.saved] } : next.problems?.form ? { text: next.problems.form, tone: "error" } : null,
  );

  return (
    <form action={formAction} className="flex flex-1 flex-col">
      <input type="hidden" name="nutritionistId" value={nutritionist.id} />
      <div className="flex flex-col gap-4 px-5 pb-6 md:px-6">
        <h3 className={h3}>{t.applicationDetails}</h3>
        <p className={fieldHint}>{t.fixTyposHint}</p>
        <label className={label}>
          {t.fullName}
          <input name="name" required defaultValue={nutritionist.name} className={inputClass} />
        </label>
        <label className={label}>
          {t.signInEmail}
          <input name="email" type="email" required defaultValue={nutritionist.email} className={inputClass} />
        </label>
        <ProfileFields values={nutritionist} />

        <label className={`${label} border-t border-divider pt-4`}>
          {t.noteToNutritionist}
          <textarea
            name="note"
            rows={4}
            maxLength={REVIEW_NOTE_MAX}
            defaultValue={nutritionist.note ?? ""}
            placeholder={t.notePlaceholder}
            className={textarea}
          />
          <span className={fieldHint}>{t.noteHint}</span>
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
            {savedMessages[state.saved]}
          </p>
        )}
      </div>

      <div className="sticky bottom-0 mt-auto flex flex-wrap items-center gap-2 border-t border-line bg-surface px-5 py-4 md:px-6">
        <SubmitButton name="decision" value="save" pendingText={t.saving} className={buttonSecondary}>
          {t.saveChanges}
        </SubmitButton>
        <span className="flex-1" />
        <SubmitButton name="decision" value="REJECTED" pendingText={t.saving} className={buttonDanger}>
          {t.reject}
        </SubmitButton>
        <SubmitButton name="decision" value="APPROVED" pendingText={t.saving} className={buttonPrimary}>
          {t.approve}
        </SubmitButton>
      </div>
    </form>
  );
}
