/** Account settings rules shared by the profile forms and the auth update hook. */
import type { Locale } from "@/lib/i18n/negotiate";
import { accountErrors } from "./messages";

export const MAX_NAME_LENGTH = 100;
/** Better Auth's default password length bounds. */
export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 128;

export class InvalidDisplayNameError extends Error {
  constructor(locale: Locale = "en") {
    super(accountErrors[locale].displayName(MAX_NAME_LENGTH));
    this.name = "InvalidDisplayNameError";
  }
}

/** Trims and collapses whitespace; rejects blank or overly long names. */
export function parseDisplayName(raw: unknown, locale: Locale = "en"): string {
  if (typeof raw !== "string") throw new InvalidDisplayNameError(locale);
  const name = raw.trim().replace(/\s+/g, " ");
  if (name.length === 0 || name.length > MAX_NAME_LENGTH) throw new InvalidDisplayNameError(locale);
  return name;
}

/**
 * Logic of the auth user-update hook. Better Auth's updateUser always sends a
 * `name` key (undefined when not changing it), so only a defined name is
 * validated; anything else passes through unchanged.
 */
export function normalizeNameUpdate<T extends Record<string, unknown>>(
  update: T,
  locale: Locale = "en",
): { data: T } | undefined {
  if (update.name === undefined) return undefined;
  return { data: { ...update, name: parseDisplayName(update.name, locale) } };
}
