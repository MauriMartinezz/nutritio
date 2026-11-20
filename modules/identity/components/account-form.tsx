"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { saveOwnSex } from "@/modules/clients/actions";
import { SEX_LABELS, type Sex } from "@/modules/clients/preferences";
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
import { MAX_NAME_LENGTH } from "../account";

type Props = {
  name: string;
  email: string;
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

    const newName = String(form.get("name")).trim();
    if (newName !== name) {
      const { error } = await authClient.updateUser({ name: newName });
      if (error) {
        setPending(false);
        setError(error.message ?? "Something went wrong. Please try again.");
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
    router.refresh();
  }

  const details = (
    <dl className="grid gap-4 sm:grid-cols-2">
      {!editing && <Detail term="Full name">{name}</Detail>}
      {!editing && isClient && <Detail term="Sex">{sex ? SEX_LABELS[sex] : "Not set"}</Detail>}
      <Detail term="Email">{email}</Detail>
      <Detail term="Role">{role}</Detail>
    </dl>
  );

  if (!editing) {
    return (
      <div className="flex flex-col gap-4">
        {details}
        {saved && (
          <p role="status" className={formSuccess}>
            Account saved.
          </p>
        )}
        <button type="button" onClick={startEditing} className={`${buttonSecondary} self-start`}>
          Edit
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <label className={label}>
        Full name
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
          <legend className="mb-1 text-sm font-semibold">Sex</legend>
          <div className="max-w-xs">
            <Segmented
              name="sex"
              required
              defaultValue={sex}
              options={Object.entries(SEX_LABELS).map(([value, label]) => ({ value, label }))}
            />
          </div>
          <p className="text-xs text-secondary">
            Women and men have different needs; your nutritionist may also ask about your menstrual cycle.
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
          <ButtonLabel pending={pending} pendingText="Saving…">
            Save
          </ButtonLabel>
        </button>
        <button type="button" disabled={pending} onClick={() => setEditing(false)} className={buttonSecondary}>
          Cancel
        </button>
      </div>
    </form>
  );
}
