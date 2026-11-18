/** Account settings rules shared by the profile forms and the auth update hook. */

export const MAX_NAME_LENGTH = 100;
/** Better Auth's default password length bounds. */
export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 128;

export class InvalidDisplayNameError extends Error {
  constructor() {
    super(`Enter a name of 1 to ${MAX_NAME_LENGTH} characters`);
    this.name = "InvalidDisplayNameError";
  }
}

/** Trims and collapses whitespace; rejects blank or overly long names. */
export function parseDisplayName(raw: unknown): string {
  if (typeof raw !== "string") throw new InvalidDisplayNameError();
  const name = raw.trim().replace(/\s+/g, " ");
  if (name.length === 0 || name.length > MAX_NAME_LENGTH) throw new InvalidDisplayNameError();
  return name;
}

/**
 * Logic of the auth user-update hook. Better Auth's updateUser always sends a
 * `name` key (undefined when not changing it), so only a defined name is
 * validated; anything else passes through unchanged.
 */
export function normalizeNameUpdate<T extends Record<string, unknown>>(update: T): { data: T } | undefined {
  if (update.name === undefined) return undefined;
  return { data: { ...update, name: parseDisplayName(update.name) } };
}
