"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { useLocale, useMessages } from "@/lib/i18n/client";
import { saveOwnSex } from "@/modules/clients/actions";
import { preferenceLabels } from "@/modules/clients/messages";
import type { Sex } from "@/modules/clients/preferences";
import {
  buttonPrimary,
  buttonSecondary,
  fieldError,
  formSuccess,
  input,
  label,
} from "@/modules/ui/classes";
import { Segmented } from "@/modules/ui/components/segmented";
import { ButtonLabel } from "@/modules/ui/components/spinner";
import { notify } from "@/modules/ui/components/toast";
import { InvalidDisplayNameError, MAX_NAME_LENGTH, parseDisplayName } from "../account";
import { accountMessages } from "../messages";

type Props = {
  name: string;
  email: string;
  /** Already translated, e.g. "Paciente". */
  role: string;
  /** Only clients have it: undefined hides the field, null means not set yet. */
  sex?: Sex | null;
};

function Detail({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <div className={label}>
      <dt>{term}</dt>
      <dd className="font-normal text-secondary">{children}</dd>
    </div>
  );
}

/**
 * Shows the account data read-only; "Edit" unlocks the name (and, for
 * clients, the sex) so they can't be changed by accident.
 */
export function AccountForm({ name, email, role, sex }: Props) {
  const router = useRouter();
  const locale = useLocale();
  const t = useMessages(accountMessages);
  const sexLabels = useMessages(preferenceLabels).sex;
  const isClient = sex !== undefined;
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);

  function startEditing() {
    setSaved(false);
    setError(null);
    setEditing(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);
    const form = new FormData(event.currentTarget);

    let newName: string;
    try {
      // Same rule the server applies, checked here so the message is in the visitor's language.
      newName = parseDisplayName(form.get("name"), locale);
    } catch (error) {
      if (!(error instanceof InvalidDisplayNameError)) throw error;
      setPending(false);
      setError(error.message);
      return;
    }
    if (newName !== name) {
      const { error } = await authClient.updateUser({ name: newName });
      if (error) {
        setPending(false);
        setError(t.genericError);
        return;
      }
    }

    const newSex = String(form.get("sex") ?? "");
    if (isClient && newSex !== sex) {
      const result = await saveOwnSex(newSex);
      if (result.error) {
        setPending(false);
        setError(result.error);
        return;
      }
    }

    setPending(false);
    setEditing(false);
    setSaved(true);
    notify(t.accountSaved);
    router.refresh();
  }

  const details = (
    <dl className="grid gap-4 sm:grid-cols-2">
      {!editing && <Detail term={t.fullName}>{name}</Detail>}
      {!editing && isClient && <Detail term={t.sex}>{sex ? sexLabels[sex] : t.notSet}</Detail>}
      <Detail term={t.email}>{email}</Detail>
      <Detail term={t.role}>{role}</Detail>
    </dl>
  );

  if (!editing) {
    return (
      <div className="flex flex-col gap-4">
        {details}
        {saved && (
          <p role="status" className={formSuccess}>
            {t.accountSaved}
          </p>
        )}
        <button type="button" onClick={startEditing} className={`${buttonSecondary} self-start`}>
          {t.edit}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <label className={label}>
        {t.fullName}
        <input
          name="name"
          required
          maxLength={MAX_NAME_LENGTH}
          defaultValue={name}
          autoComplete="name"
          className={input}
          autoFocus
        />
      </label>
      {isClient && (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-semibold">{t.sex}</legend>
          <div className="max-w-xs">
            <Segmented
              name="sex"
              required
              defaultValue={sex}
              options={Object.entries(sexLabels).map(([value, label]) => ({ value, label }))}
            />
          </div>
          <p className="text-xs text-secondary">
            {t.sexHint}
          </p>
        </fieldset>
      )}
      <div className="border-t border-divider pt-4">{details}</div>
      {error && (
        <p role="alert" className={fieldError}>
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={pending} className={buttonPrimary}>
          <ButtonLabel pending={pending} pendingText={t.saving}>
            {t.save}
          </ButtonLabel>
        </button>
        <button type="button" disabled={pending} onClick={() => setEditing(false)} className={buttonSecondary}>
          {t.cancel}
        </button>
      </div>
    </form>
  );
}
