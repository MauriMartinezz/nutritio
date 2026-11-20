"use client";

// Form inputs for the nutritionist profile, shared by sign-up and the admin editor.
// Inputs stay uncontrolled; the masks only reformat what the person types.

import type { ChangeEvent } from "react";
import { useMessages } from "@/lib/i18n/client";
import { fieldHint, input, label } from "@/modules/ui/classes";
import {
  formatDni,
  maskDateInput,
  maskDniInput,
  maskPhoneNumberInput,
  maskPhonePrefixInput,
  splitPhone,
} from "../profile";
import { nutritionistMessages } from "../messages";

/** Full-width text input (kept as an export: other forms import it). */
export const inputClass = `${input} w-full`;

export type ProfileFieldValues = {
  dni?: string | null;
  licenseNumber?: string | null;
  birthDate?: string | null; // dd/mm/yyyy
  phone?: string | null;
  specialty?: string | null;
};

function masked(mask: (raw: string) => string) {
  return (event: ChangeEvent<HTMLInputElement>) => {
    event.currentTarget.value = mask(event.currentTarget.value);
  };
}

export function ProfileFields({ values = {} }: { values?: ProfileFieldValues }) {
  const t = useMessages(nutritionistMessages);
  const phone = splitPhone(values.phone);

  return (
    <>
      <label className={label}>
        {t.dni}
        <input
          name="dni"
          required
          inputMode="numeric"
          placeholder="30.123.456"
          pattern="[1-9]\d{0,2}(\.\d{3}){2}"
          title={t.dniTitle}
          defaultValue={values.dni ? formatDni(values.dni) : ""}
          onChange={masked(maskDniInput)}
          className={inputClass}
        />
      </label>
      <label className={label}>
        {t.license}
        <input
          name="licenseNumber"
          required
          maxLength={30}
          defaultValue={values.licenseNumber ?? ""}
          className={inputClass}
        />
      </label>
      <label className={label}>
        {t.dateOfBirth}
        <input
          name="birthDate"
          required
          inputMode="numeric"
          placeholder={t.datePlaceholder}
          pattern="\d{2}/\d{2}/\d{4}"
          title={t.datePlaceholder}
          autoComplete="bday"
          defaultValue={values.birthDate ?? ""}
          onChange={masked(maskDateInput)}
          className={inputClass}
        />
        <span className={fieldHint}>{t.minAgeHint}</span>
      </label>
      <fieldset className="flex flex-col gap-1 text-sm">
        <legend className="mb-1 font-medium">{t.contactPhone}</legend>
        <div className="flex gap-2">
          <label className="w-28 shrink-0">
            <span className="sr-only">{t.prefix}</span>
            <input
              name="phonePrefix"
              required
              inputMode="tel"
              placeholder="+54 11"
              pattern="\+\d{1,4}( \d{1,4}){0,2}"
              title={t.prefixTitle}
              autoComplete="tel-country-code"
              defaultValue={phone.prefix}
              onChange={masked(maskPhonePrefixInput)}
              className={inputClass}
            />
          </label>
          <label className="min-w-0 flex-1">
            <span className="sr-only">{t.number}</span>
            <input
              name="phoneNumber"
              required
              inputMode="numeric"
              placeholder="5555 1234"
              autoComplete="tel-local"
              defaultValue={phone.number}
              onChange={masked(maskPhoneNumberInput)}
              className={inputClass}
            />
          </label>
        </div>
        <span className={fieldHint}>{t.phoneHint}</span>
      </fieldset>
      <label className={label}>
        <span>
          {t.specialty} <span className={fieldHint}>{t.optional}</span>
        </span>
        <input
          name="specialty"
          maxLength={100}
          defaultValue={values.specialty ?? ""}
          className={inputClass}
        />
      </label>
    </>
  );
}
