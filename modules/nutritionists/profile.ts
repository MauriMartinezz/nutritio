// Nutritionist profile data: entered at sign-up, editable afterwards only by admins.

export const PROFILE_FIELDS = ["dni", "licenseNumber", "birthDate", "phone", "specialty"] as const;
export type ProfileField = (typeof PROFILE_FIELDS)[number];

export type NutritionistProfile = {
  dni: string;
  licenseNumber: string;
  birthDate: Date;
  phone: string;
  specialty: string | null;
};

export class InvalidProfileError extends Error {
  constructor(readonly problems: Partial<Record<ProfileField, string>>) {
    super(`Invalid nutritionist profile: ${Object.values(problems).join("; ")}`);
    this.name = "InvalidProfileError";
  }
}

// 1.000.000 to 999.999.999, stored as digits only.
const DNI = /^[1-9]\d{6,8}$/;
const DNI_MAX_DIGITS = 9;
// Country/area prefix, e.g. "+54 11" or "+54 9 2966".
const PHONE_PREFIX = /^\+\d{1,4}(?: \d{1,4}){0,2}$/;
// Prefix + number grouped every 4 digits, as buildPhone writes it.
const PHONE = /^\+\d{1,4}(?: \d{1,4}){0,2} \d{4} \d{2,4}$/;
const PHONE_MAX_LENGTH = 20; // the size of the column
const MIN_AGE = 18;
const MAX_AGE = 100;

const text = (value: unknown) => (typeof value === "string" ? value.trim() : "");

const digits = (value: string) => value.replace(/\D/g, "");

/** Groups digits by thousands with dots: "30123456" → "30.123.456". */
export function formatDni(dni: string): string {
  return digits(dni).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/** Formats the DNI field while typing. */
export function maskDniInput(raw: string): string {
  return formatDni(digits(raw).slice(0, DNI_MAX_DIGITS));
}

/** Formats the birth date field while typing: "20051990" → "20/05/1990". */
export function maskDateInput(raw: string): string {
  const d = digits(raw).slice(0, 8);
  return [d.slice(0, 2), d.slice(2, 4), d.slice(4)].filter(Boolean).join("/");
}

/** "dd/mm/yyyy" → a UTC-midnight Date; null if it isn't a real day. */
export function parseBirthDateInput(value: string): Date | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value.trim());
  return match ? parseDate(`${match[3]}-${match[2]}-${match[1]}`) : null;
}

/** A stored birth date as "dd/mm/yyyy". */
export function formatBirthDate(date: Date): string {
  const [year, month, day] = date.toISOString().slice(0, 10).split("-");
  return `${day}/${month}/${year}`;
}

/** Formats the phone prefix field while typing: always starts with "+". */
export function maskPhonePrefixInput(raw: string): string {
  const cleaned = raw.replace(/[^\d ]/g, "").replace(/ {2,}/g, " ").trimStart();
  return cleaned ? `+${cleaned}`.slice(0, 10) : "";
}

/** Groups the number every 4 digits: "55551234" → "5555 1234". */
export function maskPhoneNumberInput(raw: string): string {
  return digits(raw).slice(0, 8).replace(/(\d{4})(?=\d)/g, "$1 ");
}

/** Joins and validates the two phone fields into the stored format. */
export function buildPhone(prefix: string, number: string): { phone: string } | { error: string } {
  const cleanPrefix = prefix.trim().replace(/\s+/g, " ");
  if (!PHONE_PREFIX.test(cleanPrefix)) return { error: "Phone prefix must look like +54 11" };
  const numberDigits = digits(number);
  if (numberDigits.length < 6 || numberDigits.length > 8) {
    return { error: "Phone number must have 6 to 8 digits" };
  }
  const phone = `${cleanPrefix} ${maskPhoneNumberInput(numberDigits)}`;
  if (phone.length > PHONE_MAX_LENGTH) return { error: `Phone must be at most ${PHONE_MAX_LENGTH} characters` };
  return { phone };
}

/** Splits a stored phone back into its two fields; old free-form values go whole into the number. */
export function splitPhone(phone: string | null | undefined): { prefix: string; number: string } {
  if (!phone) return { prefix: "", number: "" };
  const match = /^(\+\d{1,4}(?: \d{1,4}){0,2}) (\d{4} \d{2,4})$/.exec(phone);
  return match ? { prefix: match[1], number: match[2] } : { prefix: "", number: phone };
}

function parseDate(value: unknown): Date | null {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value !== "string") return null;
  if (value.includes("/")) return parseBirthDateInput(value);
  // The sign-up client sends a Date, which arrives as a full ISO string at midnight UTC.
  const day = value.endsWith("T00:00:00.000Z") ? value.slice(0, 10) : value;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return null;
  const date = new Date(`${day}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== day ? null : date;
}

function ageOn(birthDate: Date, today: Date): number {
  let age = today.getUTCFullYear() - birthDate.getUTCFullYear();
  const beforeBirthday =
    today.getUTCMonth() < birthDate.getUTCMonth() ||
    (today.getUTCMonth() === birthDate.getUTCMonth() && today.getUTCDate() < birthDate.getUTCDate());
  if (beforeBirthday) age -= 1;
  return age;
}

/** Validates and normalizes profile input, reporting every invalid field at once. */
export function parseNutritionistProfile(
  input: Record<string, unknown>,
  today: Date = new Date(),
): NutritionistProfile {
  const problems: Partial<Record<ProfileField, string>> = {};

  const dni = text(input.dni).replaceAll(".", "");
  if (!DNI.test(dni)) problems.dni = "DNI must be between 1.000.000 and 999.999.999";

  const licenseNumber = text(input.licenseNumber);
  if (licenseNumber.length === 0 || licenseNumber.length > 30) {
    problems.licenseNumber = "License number is required (max 30 characters)";
  }

  const birthDate = parseDate(input.birthDate);
  if (!birthDate) {
    problems.birthDate = "Birth date must be a valid date";
  } else {
    const age = ageOn(birthDate, today);
    if (birthDate > today || age < MIN_AGE || age > MAX_AGE) {
      problems.birthDate = `Age must be between ${MIN_AGE} and ${MAX_AGE}`;
    }
  }

  let phone = text(input.phone);
  if (input.phonePrefix !== undefined || input.phoneNumber !== undefined) {
    const built = buildPhone(text(input.phonePrefix), text(input.phoneNumber));
    if ("error" in built) problems.phone = built.error;
    else phone = built.phone;
  } else if (!PHONE.test(phone) || phone.length > PHONE_MAX_LENGTH) {
    problems.phone = "Phone must be a prefix like +54 11 followed by the number";
  }

  const specialty = text(input.specialty);
  if (specialty.length > 100) problems.specialty = "Specialty must be at most 100 characters";

  if (Object.keys(problems).length > 0) throw new InvalidProfileError(problems);

  return { dni, licenseNumber, birthDate: birthDate!, phone, specialty: specialty || null };
}
