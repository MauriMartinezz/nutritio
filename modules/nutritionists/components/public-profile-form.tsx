"use client";

import { useActionState } from "react";
import { updatePublicProfile, type UpdatePublicProfileState } from "../actions";
import { PUBLIC_PROFILE_LIMITS } from "../public-profile";
import { buttonPrimary, callout, card, formSuccess, label, textarea } from "@/modules/ui/classes";
import { inputClass } from "./profile-fields";

export type PublicProfileValues = {
  bio: string | null;
  education: string | null;
  planIncludes: string | null;
  /** Decimal as a string, e.g. "25000.00". */
  feeAmount: string | null;
  feeCurrency: "ARS" | "USD";
  feeDescription: string | null;
};

export function PublicProfileForm({ profile }: { profile: PublicProfileValues }) {
  const [state, formAction, pending] = useActionState<UpdatePublicProfileState, FormData>(
    updatePublicProfile,
    {},
  );
  const problems = state.problems ?? {};

  return (
    <form action={formAction} className={`${card} w-full`}>
      <label className={label}>
        About you
        <textarea
          name="bio"
          rows={4}
          maxLength={PUBLIC_PROFILE_LIMITS.bio}
          defaultValue={profile.bio ?? ""}
          placeholder="Who you are and how you work"
          className={`${textarea} w-full`}
        />
      </label>
      <label className={label}>
        Education
        <textarea
          name="education"
          rows={2}
          maxLength={PUBLIC_PROFILE_LIMITS.education}
          defaultValue={profile.education ?? ""}
          placeholder="Where you studied"
          className={`${textarea} w-full`}
        />
      </label>
      <label className={label}>
        What your plan includes
        <textarea
          name="planIncludes"
          rows={4}
          maxLength={PUBLIC_PROFILE_LIMITS.planIncludes}
          defaultValue={profile.planIncludes ?? ""}
          placeholder="e.g. weekly check-ins, shopping list, recipes"
          className={`${textarea} w-full`}
        />
      </label>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 text-sm font-semibold">Fee</legend>
        <div className="flex flex-col gap-3 sm:flex-row">
          <label className={`${label} sm:w-28`}>
            Currency
            <select name="feeCurrency" defaultValue={profile.feeCurrency} className={inputClass}>
              <option value="ARS">ARS</option>
              <option value="USD">USD</option>
            </select>
          </label>
          <label className={`${label} flex-1`}>
            Amount
            <span className="relative flex items-center">
              <span aria-hidden className="pointer-events-none absolute left-3 font-mono text-secondary">
                $
              </span>
              <input
                name="feeAmount"
                inputMode="decimal"
                defaultValue={profile.feeAmount ?? ""}
                placeholder="25000"
                className={`${inputClass} pl-7 font-mono`}
              />
            </span>
          </label>
        </div>
        <label className={label}>
          Fee description
          <input
            name="feeDescription"
            maxLength={PUBLIC_PROFILE_LIMITS.feeDescription}
            defaultValue={profile.feeDescription ?? ""}
            placeholder="per month, per consultation…"
            className={inputClass}
          />
        </label>
      </fieldset>

      {Object.keys(problems).length > 0 && (
        <ul role="alert" className={`${callout("danger")} list-inside list-disc`}>
          {Object.entries(problems).map(([field, message]) => (
            <li key={field}>{message}</li>
          ))}
        </ul>
      )}
      {state.saved && (
        <p role="status" className={formSuccess}>
          Public profile saved.
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className={`${buttonPrimary} self-start`}
      >
        {pending ? "Saving…" : "Save public profile"}
      </button>
    </form>
  );
}
