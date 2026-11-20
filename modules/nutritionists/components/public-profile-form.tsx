"use client";

import { useActionState } from "react";
import { useMessages } from "@/lib/i18n/client";
import { ButtonLabel } from "@/modules/ui/components/spinner";
import { nutritionistMessages } from "../messages";
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
  const t = useMessages(nutritionistMessages);

  return (
    <form action={formAction} className={`${card} w-full`}>
      <label className={label}>
        {t.aboutYou}
        <textarea
          name="bio"
          rows={4}
          maxLength={PUBLIC_PROFILE_LIMITS.bio}
          defaultValue={profile.bio ?? ""}
          placeholder={t.aboutYouPlaceholder}
          className={`${textarea} w-full`}
        />
      </label>
      <label className={label}>
        {t.education}
        <textarea
          name="education"
          rows={2}
          maxLength={PUBLIC_PROFILE_LIMITS.education}
          defaultValue={profile.education ?? ""}
          placeholder={t.educationPlaceholder}
          className={`${textarea} w-full`}
        />
      </label>
      <label className={label}>
        {t.planIncludesLabel}
        <textarea
          name="planIncludes"
          rows={4}
          maxLength={PUBLIC_PROFILE_LIMITS.planIncludes}
          defaultValue={profile.planIncludes ?? ""}
          placeholder={t.planIncludesPlaceholder}
          className={`${textarea} w-full`}
        />
      </label>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 text-sm font-semibold">{t.fee}</legend>
        <div className="flex flex-col gap-3 sm:flex-row">
          <label className={`${label} sm:w-28`}>
            {t.currency}
            <select name="feeCurrency" defaultValue={profile.feeCurrency} className={inputClass}>
              <option value="ARS">ARS</option>
              <option value="USD">USD</option>
            </select>
          </label>
          <label className={`${label} flex-1`}>
            {t.amount}
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
          {t.feeDescription}
          <input
            name="feeDescription"
            maxLength={PUBLIC_PROFILE_LIMITS.feeDescription}
            defaultValue={profile.feeDescription ?? ""}
            placeholder={t.feeDescriptionPlaceholder}
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
          {t.publicProfileSaved}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className={`${buttonPrimary} self-start`}
      >
        <ButtonLabel pending={pending} pendingText={t.saving}>
          {t.savePublicProfile}
        </ButtonLabel>
      </button>
    </form>
  );
}
