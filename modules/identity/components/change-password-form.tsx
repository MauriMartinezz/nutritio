"use client";

import { useState, type FormEvent } from "react";
import { authClient } from "@/lib/auth-client";
import { useMessages } from "@/lib/i18n/client";
import { buttonPrimary, buttonSecondary, fieldError, fieldHint, formSuccess, input, label } from "@/modules/ui/classes";
import { ButtonLabel } from "@/modules/ui/components/spinner";
import { MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH } from "../account";
import { accountMessages } from "../messages";

/** Hidden behind an "Update password" button; changing it signs out other devices. */
export function ChangePasswordForm() {
  const t = useMessages(accountMessages);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaved(false);
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const newPassword = String(form.get("newPassword"));
    if (newPassword !== String(form.get("confirmPassword"))) {
      setError(t.passwordsDontMatch);
      return;
    }
    setPending(true);
    const { error } = await authClient.changePassword({
      currentPassword: String(form.get("currentPassword")),
      newPassword,
      revokeOtherSessions: true,
    });
    setPending(false);
    if (error) {
      // Better Auth error codes; its messages are English only.
      if (error.code === "INVALID_PASSWORD") setError(t.wrongPassword);
      else if (error.code === "PASSWORD_TOO_SHORT" || error.code === "PASSWORD_TOO_LONG") {
        setError(t.passwordLength(MIN_PASSWORD_LENGTH, MAX_PASSWORD_LENGTH));
      } else setError(t.genericError);
      return;
    }
    formElement.reset();
    setOpen(false);
    setSaved(true);
  }

  if (!open) {
    return (
      <div className="flex flex-col gap-4">
        {saved && (
          <p role="status" className={formSuccess}>
            {t.passwordChanged}
          </p>
        )}
        <button
          type="button"
          onClick={() => {
            setSaved(false);
            setError(null);
            setOpen(true);
          }}
          className={`${buttonSecondary} self-start`}
        >
          {t.updatePassword}
        </button>
      </div>
    );
  }

  const passwordProps = {
    type: "password",
    required: true,
    minLength: MIN_PASSWORD_LENGTH,
    maxLength: MAX_PASSWORD_LENGTH,
    autoComplete: "new-password",
    className: input,
  } as const;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <label className={label}>
        {t.currentPassword}
        <input
          name="currentPassword"
          type="password"
          required
          autoComplete="current-password"
          className={input}
          autoFocus
        />
      </label>
      <label className={label}>
        {t.newPassword}
        <input name="newPassword" {...passwordProps} />
        <span className={fieldHint}>{t.passwordHint(MIN_PASSWORD_LENGTH)}</span>
      </label>
      <label className={label}>
        {t.repeatNewPassword}
        <input name="confirmPassword" {...passwordProps} />
      </label>
      {error && (
        <p role="alert" className={fieldError}>
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={pending} className={buttonPrimary}>
          <ButtonLabel pending={pending} pendingText={t.saving}>
            {t.changePassword}
          </ButtonLabel>
        </button>
        <button type="button" disabled={pending} onClick={() => setOpen(false)} className={buttonSecondary}>
          {t.cancel}
        </button>
      </div>
    </form>
  );
}
