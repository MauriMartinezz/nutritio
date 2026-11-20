"use client";

import { useActionState } from "react";
import { buttonPrimary, callout, fieldHint, formSuccess, h3 } from "@/modules/ui/classes";
import { resubmitApplication, type ResubmitApplicationState } from "../actions";
import { ProfileFields, type ProfileFieldValues } from "./profile-fields";

/** Shown to a rejected nutritionist: fix the data and send the application again. */
export function ResubmitForm({ values }: { values: ProfileFieldValues }) {
  const [state, formAction, pending] = useActionState<ResubmitApplicationState, FormData>(
    resubmitApplication,
    {},
  );
  const problems = state.problems ?? {};

  if (state.sent) {
    return (
      <p role="status" className={formSuccess}>
        Application sent. An admin will review it again.
      </p>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4 border-t border-divider pt-4">
      <h3 className={h3}>Send your application again</h3>
      <p className={fieldHint}>Correct what the admin pointed out and send it for a new review.</p>
      <ProfileFields values={values} />
      {Object.keys(problems).length > 0 && (
        <ul role="alert" className={`${callout("danger")} list-inside list-disc`}>
          {Object.entries(problems).map(([field, message]) => (
            <li key={field}>{message}</li>
          ))}
        </ul>
      )}
      <button type="submit" disabled={pending} className={`${buttonPrimary} self-start`}>
        {pending ? "Sending…" : "Send again"}
      </button>
    </form>
  );
}
