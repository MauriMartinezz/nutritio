// Locale-aware formatting. es → Argentina (dd/mm/yyyy, decimal comma).
import type { Locale } from "./negotiate";

const INTL_LOCALE: Record<Locale, string> = { es: "es-AR", en: "en-US" };

export const intlLocale = (locale: Locale) => INTL_LOCALE[locale];

/** A calendar day stored at UTC midnight, e.g. 20/05/1990 or 05/20/1990. */
export function formatDay(date: Date, locale: Locale, options: Intl.DateTimeFormatOptions = {}): string {
  return new Intl.DateTimeFormat(INTL_LOCALE[locale], { timeZone: "UTC", ...options }).format(date);
}

/** A moment in time, in Argentina's time zone. */
export function formatDateTime(date: Date, locale: Locale, options: Intl.DateTimeFormatOptions = {}): string {
  return new Intl.DateTimeFormat(INTL_LOCALE[locale], {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Argentina/Buenos_Aires",
    ...options,
  }).format(date);
}

export function formatNumber(value: number, locale: Locale, options: Intl.NumberFormatOptions = {}): string {
  return new Intl.NumberFormat(INTL_LOCALE[locale], options).format(value);
}
