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

const DNI = /^\d{7,8}$/;
const PHONE = /^(?=(?:\D*\d){6,20}\D*$)[\d\s+()-]+$/;
const MIN_AGE = 18;
const MAX_AGE = 100;

const text = (value: unknown) => (typeof value === "string" ? value.trim() : "");

function parseDate(value: unknown): Date | null {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value ? null : date;
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

  const dni = text(input.dni);
  if (!DNI.test(dni)) problems.dni = "DNI must have 7 or 8 digits";

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

  const phone = text(input.phone);
  if (!PHONE.test(phone)) problems.phone = "Phone must have 6 to 20 digits";

  const specialty = text(input.specialty);
  if (specialty.length > 100) problems.specialty = "Specialty must be at most 100 characters";

  if (Object.keys(problems).length > 0) throw new InvalidProfileError(problems);

  return { dni, licenseNumber, birthDate: birthDate!, phone, specialty: specialty || null };
}
