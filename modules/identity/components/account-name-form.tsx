"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { buttonPrimary, fieldError, formSuccess, input, label } from "@/modules/ui/classes";
import { MAX_NAME_LENGTH } from "../account";

/** Edits the signed-in user's display name through the auth API. */
export function AccountNameForm({ name }: { name: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaved(false);
    setPending(true);
    const form = new FormData(event.currentTarget);
    const { error } = await authClient.updateUser({ name: String(form.get("name")) });
    setPending(false);
    if (error) {
      setError(error.message ?? "Something went wrong. Please try again.");
      return;
    }
    setSaved(true);
    router.refresh();
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
        />
      </label>
      {error && (
        <p role="alert" className={fieldError}>
          {error}
        </p>
      )}
      {saved && (
        <p role="status" className={formSuccess}>
          Name saved.
        </p>
      )}
      <button type="submit" disabled={pending} className={`${buttonPrimary} self-start`}>
        {pending ? "Saving…" : "Save name"}
      </button>
    </form>
  );
}
