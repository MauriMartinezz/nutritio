// Form inputs for the nutritionist profile, shared by sign-up and the admin editor.
// Plain inputs (no hooks), so it renders in both Server and Client Components.

export const inputClass =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900";

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
      <label className="flex flex-col gap-1 text-sm">
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
      <label className="flex flex-col gap-1 text-sm">
        Professional license (MN / MP)
        <input
          name="licenseNumber"
          required
          maxLength={30}
          defaultValue={values.licenseNumber ?? ""}
          className={inputClass}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Date of birth
        <input
          name="birthDate"
          type="date"
          required
          defaultValue={values.birthDate ?? ""}
          className={inputClass}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
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
      <label className="flex flex-col gap-1 text-sm">
        Specialty <span className="text-zinc-500">(optional)</span>
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
