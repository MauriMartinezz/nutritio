// Client nutrition preferences: labels, form texts and validation errors.
import { defineMessages } from "@/lib/i18n/messages";

/** Readable labels for the preference fields; preferences.ts reads the keys from the English table. */
export const preferenceLabels = defineMessages({
  en: {
    flags: {
      lowCarb: "Low carb",
      vegan: "Vegan",
      vegetarian: "Vegetarian",
      glutenFree: "Gluten free",
      prefersMealPrep: "Meal prep",
    },
    medical: {
      diabetic: "Diabetic",
      celiac: "Celiac",
      hypertension: "Hypertension",
    },
    cookingStyles: {
      BASIC: "Basic meals",
      ELABORATE: "Elaborate meals",
      NO_PREFERENCE: "No preference",
    },
    sex: { FEMALE: "Woman", MALE: "Man" },
    texts: {
      intolerances: "Intolerances",
      otherConditions: "Other conditions",
      notes: "Notes",
    },
    intolerantTo: (list: string) => `Intolerant to: ${list}`,
  },
  es: {
    flags: {
      lowCarb: "Bajo en carbohidratos",
      vegan: "Vegano",
      vegetarian: "Vegetariano",
      glutenFree: "Sin gluten",
      prefersMealPrep: "Viandas preparadas",
    },
    medical: {
      diabetic: "Diabetes",
      celiac: "Celiaquía",
      hypertension: "Hipertensión",
    },
    cookingStyles: {
      BASIC: "Comidas simples",
      ELABORATE: "Comidas elaboradas",
      NO_PREFERENCE: "Sin preferencia",
    },
    sex: { FEMALE: "Mujer", MALE: "Hombre" },
    texts: {
      intolerances: "Intolerancias",
      otherConditions: "Otras condiciones",
      notes: "Notas",
    },
    intolerantTo: (list: string) => `Intolerancia a: ${list}`,
  },
});

/** Errors from the pure preference rules (preferences.ts). */
export const preferenceErrors = defineMessages({
  en: {
    tooLong: (field: string, limit: number) => `${field} must be at most ${limit} characters`,
    cookingStyle: "Choose basic, elaborate or no preference",
    sex: "Choose woman or man",
  },
  es: {
    tooLong: (field: string, limit: number) => `${field}: como máximo ${limit} caracteres`,
    cookingStyle: "Elegí comidas simples, elaboradas o sin preferencia",
    sex: "Elegí mujer u hombre",
  },
});

export const preferencesFormMessages = defineMessages({
  en: {
    diet: "Diet",
    cookingStyle: "Cooking style",
    health: "Health",
    intolerancesPlaceholder: "e.g. lactose, walnuts",
    otherConditionsPlaceholder: "Anything else your nutritionist should know",
    notesPlaceholder: "Foods you dislike, schedule, goals…",
    saved: "Preferences saved.",
    save: "Save preferences",
    saving: "Saving…",
  },
  es: {
    diet: "Alimentación",
    cookingStyle: "Forma de cocinar",
    health: "Salud",
    intolerancesPlaceholder: "p. ej. lactosa, nueces",
    otherConditionsPlaceholder: "Cualquier otra cosa que tu nutricionista deba saber",
    notesPlaceholder: "Comidas que no te gustan, horarios, objetivos…",
    saved: "Preferencias guardadas.",
    save: "Guardar preferencias",
    saving: "Guardando…",
  },
});
