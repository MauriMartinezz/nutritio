"use client";

import { useState, type FormEvent } from "react";
import { authClient } from "@/lib/auth-client";
import { buttonPrimary, buttonSecondary, fieldError, fieldHint, formSuccess, input, label } from "@/modules/ui/classes";
import { ButtonLabel } from "@/modules/ui/components/spinner";
import { MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH } from "../account";

/** Hidden behind an "Update password" button; changing it signs out other devices. */
export function ChangePasswordForm() {
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
      setError("The new passwords don't match.");
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
      setError(error.message ?? "Something went wrong. Please try again.");
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
            Password changed. Other devices were signed out.
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
          Update password
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
        Current password
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
        New password
        <input name="newPassword" {...passwordProps} />
        <span className={fieldHint}>At least {MIN_PASSWORD_LENGTH} characters.</span>
      </label>
      <label className={label}>
        Repeat the new password
        <input name="confirmPassword" {...passwordProps} />
      </label>
      {error && (
        <p role="alert" className={fieldError}>
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={pending} className={buttonPrimary}>
          <ButtonLabel pending={pending} pendingText="Saving…">
            Change password
          </ButtonLabel>
        </button>
        <button type="button" disabled={pending} onClick={() => setOpen(false)} className={buttonSecondary}>
          Cancel
        </button>
      </div>
    </form>
  );
}
