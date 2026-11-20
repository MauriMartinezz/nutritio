import { formatDateTime } from "@/lib/i18n/format";
import type { Locale } from "@/lib/i18n/negotiate";

const DATE_ONLY: Intl.DateTimeFormatOptions = {
  dateStyle: undefined,
  timeStyle: undefined,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
};

/** The date of a moment (access ends, requests), in Argentina's time zone: 20/11/2026 or 11/20/2026. */
export const formatDate = (date: Date, locale: Locale) => formatDateTime(date, locale, DATE_ONLY);
