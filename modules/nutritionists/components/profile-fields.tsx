// Form inputs for the nutritionist profile, shared by sign-up and the admin editor.
// Plain inputs (no hooks), so it renders in both Server and Client Components.

import { fieldHint, input, label } from "@/modules/ui/classes";

/** Full-width text input (kept as an export: other forms import it). */
export const inputClass = `${input} w-full`;

export type ProfileFieldValues = {
  dni?: string | null;
  licenseNumber?: string | null;
  birthDate?: string | null; // YYYY-MM-DD
  phone?: string | null;
  specialty?: string | null;
};

export function ProfileFields({ values = {} }: { values?: ProfileFieldValues }) {
  return (
    <>
      <label className={label}>
        DNI
        <input
          name="dni"
          required
          inputMode="numeric"
          pattern="\d{7,8}"
          title="7 or 8 digits, no dots"
          defaultValue={values.dni ?? ""}
          className={inputClass}
        />
      </label>
      <label className={label}>
        Professional license (MN / MP)
        <input
          name="licenseNumber"
          required
          maxLength={30}
          defaultValue={values.licenseNumber ?? ""}
          className={inputClass}
        />
      </label>
      <label className={label}>
        Date of birth
        <input
          name="birthDate"
          type="date"
          required
          defaultValue={values.birthDate ?? ""}
          className={inputClass}
        />
      </label>
      <label className={label}>
        Contact phone
        <input
          name="phone"
          type="tel"
          required
          autoComplete="tel"
          maxLength={20}
          defaultValue={values.phone ?? ""}
          className={inputClass}
        />
      </label>
      <label className={label}>
        <span>
          Specialty <span className={fieldHint}>(optional)</span>
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
