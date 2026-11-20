"use client";

import { useActionState } from "react";
import { useMessages } from "@/lib/i18n/client";
import { buttonPrimary, card, fieldError, fieldHint, formSuccess, input, label } from "@/modules/ui/classes";
import { ButtonLabel } from "@/modules/ui/components/spinner";
import { MAX_NAME_LENGTH } from "@/modules/identity/account";
import { updateUserByAdmin, type SupportFormState } from "../actions";
import { supportMessages } from "../messages";

export function AdminUserForm({ user }: { user: { id: string; name: string; email: string } }) {
  const t = useMessages(supportMessages);
  const [state, formAction, pending] = useActionState<SupportFormState, FormData>(updateUserByAdmin, {});
  const problems = state.problems ?? {};

  return (
    <form action={formAction} className={card}>
      <input type="hidden" name="userId" value={user.id} />
      <p className={fieldHint}>{t.userDataHint}</p>
      <label className={label}>
        {t.fullName}
        <input name="name" required maxLength={MAX_NAME_LENGTH} defaultValue={state.values?.name ?? user.name} className={`${input} w-full`} />
        {problems.name && <span className={fieldError}>{problems.name}</span>}
      </label>
      <label className={label}>
        {t.email}
        <input name="email" type="email" required defaultValue={state.values?.email ?? user.email} className={`${input} w-full`} />
        {problems.email && <span className={fieldError}>{problems.email}</span>}
      </label>
      {problems.form && (
        <p role="alert" className={fieldError}>
          {problems.form}
        </p>
      )}
      {state.saved === "user" && (
        <p role="status" className={formSuccess}>
          {t.userSaved}
        </p>
      )}
      <button type="submit" disabled={pending} className={`${buttonPrimary} self-start`}>
        <ButtonLabel pending={pending} pendingText={t.saving}>
          {t.save}
        </ButtonLabel>
      </button>
    </form>
  );
}
