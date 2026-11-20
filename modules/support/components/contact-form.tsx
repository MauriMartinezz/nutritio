"use client";

import { useActionState } from "react";
import { useMessages } from "@/lib/i18n/client";
import { buttonPrimary, card, fieldError, formSuccess, input, label, textarea } from "@/modules/ui/classes";
import { ButtonLabel } from "@/modules/ui/components/spinner";
import { sendSupportRequest, type SupportFormState } from "../actions";
import { supportMessages } from "../messages";
import { SUPPORT_LIMITS } from "../support";

export function ContactForm() {
  const t = useMessages(supportMessages);
  const [state, formAction, pending] = useActionState<SupportFormState, FormData>(sendSupportRequest, {});
  const problems = state.problems ?? {};

  return (
    // React clears the fields after each submit; a rejected one gets its values back.
    <form action={formAction} className={card}>
      <label className={label}>
        {t.title}
        <input
          name="title"
          required
          maxLength={SUPPORT_LIMITS.title}
          defaultValue={state.values?.title}
          placeholder={t.titlePlaceholder}
          className={`${input} w-full`}
        />
        {problems.title && <span className={fieldError}>{problems.title}</span>}
      </label>
      <label className={label}>
        {t.description}
        <textarea
          name="description"
          required
          rows={5}
          maxLength={SUPPORT_LIMITS.description}
          defaultValue={state.values?.description}
          placeholder={t.descriptionPlaceholder}
          className={`${textarea} w-full`}
        />
        {problems.description && <span className={fieldError}>{problems.description}</span>}
      </label>
      {state.saved === "sent" && (
        <p role="status" className={formSuccess}>
          {t.sent}
        </p>
      )}
      <button type="submit" disabled={pending} className={`${buttonPrimary} self-start`}>
        <ButtonLabel pending={pending} pendingText={t.sending}>
          {t.send}
        </ButtonLabel>
      </button>
    </form>
  );
}
