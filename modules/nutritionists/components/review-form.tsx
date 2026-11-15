"use client";

import { useActionState } from "react";
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
import { reviewNutritionist, type ReviewNutritionistState } from "../actions";
import { REVIEW_NOTE_MAX } from "../verification";
import { ProfileFields, inputClass, type ProfileFieldValues } from "./profile-fields";

export type ReviewableNutritionist = ProfileFieldValues & {
  id: string;
  name: string;
  email: string;
  note: string | null;
};

const SAVED_MESSAGES = {
  APPROVED: "Approved. The nutritionist is now listed in the directory.",
  REJECTED: "Rejected. The nutritionist will see your note on their home page.",
  PENDING: "Changes saved.",
} as const;

/** Correct the application, leave a note and decide. Buttons sit at the bottom of the panel. */
export function ReviewForm({ nutritionist }: { nutritionist: ReviewableNutritionist }) {
  const [state, formAction, pending] = useActionState<ReviewNutritionistState, FormData>(reviewNutritionist, {});
  const problems = state.problems ?? {};

  return (
    <form action={formAction} className="flex flex-1 flex-col">
      <input type="hidden" name="nutritionistId" value={nutritionist.id} />
      <div className="flex flex-col gap-4 px-5 pb-6 md:px-6">
        <h3 className={h3}>Application details</h3>
        <p className={fieldHint}>Fix typos here before deciding. Changes are saved with your decision.</p>
        <label className={label}>
          Full name
          <input name="name" required defaultValue={nutritionist.name} className={inputClass} />
        </label>
        <label className={label}>
          Email (used to sign in)
          <input name="email" type="email" required defaultValue={nutritionist.email} className={inputClass} />
        </label>
        <ProfileFields values={nutritionist} />

        <label className={`${label} border-t border-divider pt-4`}>
          Note to the nutritionist
          <textarea
            name="note"
            rows={4}
            maxLength={REVIEW_NOTE_MAX}
            defaultValue={nutritionist.note ?? ""}
            placeholder="e.g. The license number doesn't match the registry. Please check it."
            className={textarea}
          />
          <span className={fieldHint}>They see it on their home page. Explain what to fix if you reject.</span>
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
            {SAVED_MESSAGES[state.saved]}
          </p>
        )}
      </div>

      <div className="sticky bottom-0 mt-auto flex flex-wrap items-center gap-2 border-t border-line bg-surface px-5 py-4 md:px-6">
        <button name="decision" value="save" disabled={pending} className={buttonSecondary}>
          Save changes
        </button>
        <span className="flex-1" />
        <button name="decision" value="REJECTED" disabled={pending} className={buttonDanger}>
          Reject
        </button>
        <button name="decision" value="APPROVED" disabled={pending} className={buttonPrimary}>
          Approve
        </button>
      </div>
    </form>
  );
}
