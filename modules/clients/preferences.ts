// Dietary preferences and medical conditions a client shares with their nutritionists.
import type { Locale } from "@/lib/i18n/negotiate";
import { preferenceErrors, preferenceLabels } from "./messages";

export const COOKING_STYLES = ["BASIC", "ELABORATE", "NO_PREFERENCE"] as const;
export type CookingStyle = (typeof COOKING_STYLES)[number];

/** Checklist fields, in display order, with their English labels (see messages.ts for every language). */
export const PREFERENCE_FLAGS = preferenceLabels.en.flags;

export const MEDICAL_FLAGS = preferenceLabels.en.medical;

export const COOKING_STYLE_LABELS: Record<CookingStyle, string> = preferenceLabels.en.cookingStyles;

export const SEX_LABELS = preferenceLabels.en.sex;
export type Sex = keyof typeof SEX_LABELS;

export const PREFERENCE_LIMITS = {
  intolerances: 500,
  otherConditions: 500,
  notes: 1000,
} as const;

type Flag = keyof typeof PREFERENCE_FLAGS | keyof typeof MEDICAL_FLAGS;
type TextField = keyof typeof PREFERENCE_LIMITS;

export type ClientPreferences = Record<Flag, boolean> &
  Record<TextField, string | null> & {
    cookingStyle: CookingStyle;
    /** Saved from the account card (parseSex); null until the client sets it. */
    sex: Sex | null;
  };
/** What the preferences form saves; sex is edited separately, from the account card. */
export type SavedClientPreferences = Omit<ClientPreferences, "sex">;
export type ClientPreferencesField = keyof SavedClientPreferences;

export class InvalidClientPreferencesError extends Error {
  constructor(readonly problems: Partial<Record<ClientPreferencesField, string>>) {
    super(`Invalid preferences: ${Object.values(problems).join("; ")}`);
    this.name = "InvalidClientPreferencesError";
  }
}

const FLAGS = [...Object.keys(PREFERENCE_FLAGS), ...Object.keys(MEDICAL_FLAGS)] as Flag[];

const text = (value: unknown) => (typeof value === "string" ? value.trim() : "");

/**
 * Validates form input (checked checkboxes arrive as "on", unchecked ones are
 * missing), reporting every invalid field at once.
 */
export function parseClientPreferences(input: Record<string, unknown>, locale: Locale = "en"): SavedClientPreferences {
  const errors = preferenceErrors[locale];
  const problems: Partial<Record<ClientPreferencesField, string>> = {};

  const flags = {} as Record<Flag, boolean>;
  for (const flag of FLAGS) flags[flag] = input[flag] === "on";

  const texts = {} as Record<TextField, string | null>;
  for (const field of Object.keys(PREFERENCE_LIMITS) as TextField[]) {
    const value = text(input[field]);
    const limit = PREFERENCE_LIMITS[field];
    if (value.length > limit) problems[field] = errors.tooLong(preferenceLabels[locale].texts[field], limit);
    texts[field] = value || null;
  }

  const rawStyle = text(input.cookingStyle) || "NO_PREFERENCE";
  const cookingStyle = COOKING_STYLES.find((style) => style === rawStyle);
  if (!cookingStyle) problems.cookingStyle = errors.cookingStyle;

  if (Object.keys(problems).length > 0) throw new InvalidClientPreferencesError(problems);

  return { ...flags, cookingStyle: cookingStyle!, ...texts };
}

export class InvalidSexError extends Error {
  constructor(locale: Locale = "en") {
    super(preferenceErrors[locale].sex);
    this.name = "InvalidSexError";
  }
}

/** Validates the sex chosen on the account card. */
export function parseSex(input: unknown, locale: Locale = "en"): Sex {
  const value = text(input);
  if (!(value in SEX_LABELS)) throw new InvalidSexError(locale);
  return value as Sex;
}

/** Readable labels for the set preferences, e.g. ["Woman", "Low carb", "Basic meals", "Intolerant to: lactose"]. */
export function describePreferences(prefs: ClientPreferences, locale: Locale = "en"): string[] {
  const t = preferenceLabels[locale];
  const labels: string[] = prefs.sex ? [t.sex[prefs.sex]] : [];
  for (const [flag, label] of Object.entries(t.flags)) {
    if (prefs[flag as Flag]) labels.push(label);
  }
  if (prefs.cookingStyle !== "NO_PREFERENCE") labels.push(t.cookingStyles[prefs.cookingStyle]);
  for (const [flag, label] of Object.entries(t.medical)) {
    if (prefs[flag as Flag]) labels.push(label);
  }
  if (prefs.intolerances) labels.push(t.intolerantTo(prefs.intolerances));
  return labels;
}
