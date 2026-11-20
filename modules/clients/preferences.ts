// Dietary preferences and medical conditions a client shares with their nutritionists.

export const COOKING_STYLES = ["BASIC", "ELABORATE", "NO_PREFERENCE"] as const;
export type CookingStyle = (typeof COOKING_STYLES)[number];

/** Checklist fields, in display order, with their readable labels. */
export const PREFERENCE_FLAGS = {
  lowCarb: "Low carb",
  vegan: "Vegan",
  vegetarian: "Vegetarian",
  glutenFree: "Gluten free",
  prefersMealPrep: "Meal prep",
} as const;

export const MEDICAL_FLAGS = {
  diabetic: "Diabetic",
  celiac: "Celiac",
  hypertension: "Hypertension",
} as const;

export const COOKING_STYLE_LABELS: Record<CookingStyle, string> = {
  BASIC: "Basic meals",
  ELABORATE: "Elaborate meals",
  NO_PREFERENCE: "No preference",
};

export const SEX_LABELS = { FEMALE: "Woman", MALE: "Man" } as const;
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

const TEXT_LABELS: Record<TextField, string> = {
  intolerances: "Intolerances",
  otherConditions: "Other conditions",
  notes: "Notes",
};

const FLAGS = [...Object.keys(PREFERENCE_FLAGS), ...Object.keys(MEDICAL_FLAGS)] as Flag[];

const text = (value: unknown) => (typeof value === "string" ? value.trim() : "");

/**
 * Validates form input (checked checkboxes arrive as "on", unchecked ones are
 * missing), reporting every invalid field at once.
 */
export function parseClientPreferences(input: Record<string, unknown>): SavedClientPreferences {
  const problems: Partial<Record<ClientPreferencesField, string>> = {};

  const flags = {} as Record<Flag, boolean>;
  for (const flag of FLAGS) flags[flag] = input[flag] === "on";

  const texts = {} as Record<TextField, string | null>;
  for (const field of Object.keys(PREFERENCE_LIMITS) as TextField[]) {
    const value = text(input[field]);
    const limit = PREFERENCE_LIMITS[field];
    if (value.length > limit) problems[field] = `${TEXT_LABELS[field]} must be at most ${limit} characters`;
    texts[field] = value || null;
  }

  const rawStyle = text(input.cookingStyle) || "NO_PREFERENCE";
  const cookingStyle = COOKING_STYLES.find((style) => style === rawStyle);
  if (!cookingStyle) problems.cookingStyle = "Choose basic, elaborate or no preference";

  if (Object.keys(problems).length > 0) throw new InvalidClientPreferencesError(problems);

  return { ...flags, cookingStyle: cookingStyle!, ...texts };
}

export class InvalidSexError extends Error {
  constructor() {
    super("Choose woman or man");
    this.name = "InvalidSexError";
  }
}

/** Validates the sex chosen on the account card. */
export function parseSex(input: unknown): Sex {
  const value = text(input);
  if (!(value in SEX_LABELS)) throw new InvalidSexError();
  return value as Sex;
}

/** Readable labels for the set preferences, e.g. ["Woman", "Low carb", "Basic meals", "Intolerant to: lactose"]. */
export function describePreferences(prefs: ClientPreferences): string[] {
  const labels: string[] = prefs.sex ? [SEX_LABELS[prefs.sex]] : [];
  for (const [flag, label] of Object.entries(PREFERENCE_FLAGS)) {
    if (prefs[flag as Flag]) labels.push(label);
  }
  if (prefs.cookingStyle !== "NO_PREFERENCE") labels.push(COOKING_STYLE_LABELS[prefs.cookingStyle]);
  for (const [flag, label] of Object.entries(MEDICAL_FLAGS)) {
    if (prefs[flag as Flag]) labels.push(label);
  }
  if (prefs.intolerances) labels.push(`Intolerant to: ${prefs.intolerances}`);
  return labels;
}
