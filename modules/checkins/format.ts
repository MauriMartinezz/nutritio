// Dates of check-ins (moments in time, shown in Argentina's time zone).
import { formatDateTime } from "@/lib/i18n/format";
import type { Locale } from "@/lib/i18n/negotiate";

/** "20/11/2026" in Spanish, "11/20/2026" in English. */
export const formatCheckInDate = (date: Date, locale: Locale) =>
  formatDateTime(date, locale, {
    dateStyle: undefined,
    timeStyle: undefined,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

/** "20 de noviembre de 2026" / "November 20, 2026". */
export const formatCheckInDateLong = (date: Date, locale: Locale) =>
  formatDateTime(date, locale, { dateStyle: "long", timeStyle: undefined });

/** A label read as a question: "¿…?" in Spanish, "…?" in English. */
export const asQuestion = (text: string, locale: Locale) => (locale === "es" ? `¿${text}?` : `${text}?`);
