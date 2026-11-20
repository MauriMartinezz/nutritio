"use client";

import { useActionState } from "react";
import { useMessages } from "@/lib/i18n/client";
import { ButtonLabel } from "@/modules/ui/components/spinner";
import { nutritionistMessages } from "../messages";
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
  const t = useMessages(nutritionistMessages);

  if (state.sent) {
    return (
      <p role="status" className={formSuccess}>
        {t.applicationSent}
      </p>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4 border-t border-divider pt-4">
      <h3 className={h3}>{t.sendAgainTitle}</h3>
      <p className={fieldHint}>{t.sendAgainHint}</p>
      <ProfileFields values={values} />
      {Object.keys(problems).length > 0 && (
        <ul role="alert" className={`${callout("danger")} list-inside list-disc`}>
          {Object.entries(problems).map(([field, message]) => (
            <li key={field}>{message}</li>
          ))}
        </ul>
      )}
      <button type="submit" disabled={pending} className={`${buttonPrimary} self-start`}>
        <ButtonLabel pending={pending} pendingText={t.sending}>
          {t.sendAgain}
        </ButtonLabel>
      </button>
    </form>
  );
}
