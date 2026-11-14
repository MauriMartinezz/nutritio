"use client";

import { useActionState } from "react";
import { buttonPrimary, callout, card, formSuccess, label } from "@/modules/ui/classes";
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
    <form action={formAction} className={`${card} w-full max-w-xl`}>
      <label className={label}>
        Full name
        <input name="name" required defaultValue={nutritionist.name} className={inputClass} />
      </label>
      <label className={label}>
        Email (used to sign in)
        <input
          name="email"
          type="email"
          required
          defaultValue={nutritionist.email}
          className={inputClass}
        />
      </label>
      <label className={label}>
        Verification status
        <select name="status" defaultValue={nutritionist.status} className={inputClass}>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Verified</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </label>

      <ProfileFields values={nutritionist} />

      {Object.keys(problems).length > 0 && (
        <ul role="alert" className={`${callout("danger")} list-inside list-disc`}>
          {Object.entries(problems).map(([field, message]) => (
            <li key={field}>{message}</li>
          ))}
        </ul>
      )}
      {state.saved && (
        <p role="status" className={formSuccess}>
          Changes saved.
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className={`${buttonPrimary} self-start`}
      >
        {pending ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
