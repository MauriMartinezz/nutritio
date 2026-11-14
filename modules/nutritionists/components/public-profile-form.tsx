"use client";

import { useActionState } from "react";
import { updatePublicProfile, type UpdatePublicProfileState } from "../actions";
import { PUBLIC_PROFILE_LIMITS } from "../public-profile";
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
    <form action={formAction} className="flex w-full max-w-xl flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        About you
        <textarea
          name="bio"
          rows={4}
          maxLength={PUBLIC_PROFILE_LIMITS.bio}
          defaultValue={profile.bio ?? ""}
          placeholder="Who you are and how you work"
          className={inputClass}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Education
        <textarea
          name="education"
          rows={2}
          maxLength={PUBLIC_PROFILE_LIMITS.education}
          defaultValue={profile.education ?? ""}
          placeholder="Where you studied"
          className={inputClass}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        What your plan includes
        <textarea
          name="planIncludes"
          rows={4}
          maxLength={PUBLIC_PROFILE_LIMITS.planIncludes}
          defaultValue={profile.planIncludes ?? ""}
          placeholder="e.g. weekly check-ins, shopping list, recipes"
          className={inputClass}
        />
      </label>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 text-sm font-medium">Fee</legend>
        <div className="flex gap-3">
          <label className="flex w-28 flex-col gap-1 text-sm">
            Currency
            <select name="feeCurrency" defaultValue={profile.feeCurrency} className={inputClass}>
              <option value="ARS">ARS</option>
              <option value="USD">USD</option>
            </select>
          </label>
          <label className="flex flex-1 flex-col gap-1 text-sm">
            Amount
            <input
              name="feeAmount"
              inputMode="decimal"
              defaultValue={profile.feeAmount ?? ""}
              placeholder="25000"
              className={inputClass}
            />
          </label>
        </div>
        <label className="flex flex-col gap-1 text-sm">
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
        <ul role="alert" className="list-inside list-disc text-sm text-red-600">
          {Object.entries(problems).map(([field, message]) => (
            <li key={field}>{message}</li>
          ))}
        </ul>
      )}
      {state.saved && (
        <p role="status" className="text-sm text-emerald-700 dark:text-emerald-400">
          Public profile saved.
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save public profile"}
      </button>
    </form>
  );
}
