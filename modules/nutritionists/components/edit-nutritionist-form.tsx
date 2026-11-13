"use client";

import { useActionState } from "react";
import { updateNutritionist, type UpdateNutritionistState } from "../actions";
import { ProfileFields, inputClass, type ProfileFieldValues } from "./profile-fields";

export type EditableNutritionist = ProfileFieldValues & {
  id: string;
  name: string;
  email: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
};

export function EditNutritionistForm({ nutritionist }: { nutritionist: EditableNutritionist }) {
  const [state, formAction, pending] = useActionState<UpdateNutritionistState, FormData>(
    updateNutritionist.bind(null, nutritionist.id),
    {},
  );
  const problems = state.problems ?? {};

  return (
    <form action={formAction} className="flex w-full max-w-md flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        Full name
        <input name="name" required defaultValue={nutritionist.name} className={inputClass} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Email (used to sign in)
        <input
          name="email"
          type="email"
          required
          defaultValue={nutritionist.email}
          className={inputClass}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Verification status
        <select name="status" defaultValue={nutritionist.status} className={inputClass}>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Verified</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </label>

      <ProfileFields values={nutritionist} />

      {Object.keys(problems).length > 0 && (
        <ul role="alert" className="list-inside list-disc text-sm text-red-600">
          {Object.entries(problems).map(([field, message]) => (
            <li key={field}>{message}</li>
          ))}
        </ul>
      )}
      {state.saved && (
        <p role="status" className="text-sm text-emerald-700 dark:text-emerald-400">
          Changes saved.
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
