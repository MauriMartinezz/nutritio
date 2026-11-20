// Picks the UI language. Pure: used by proxy.ts and unit tested.

export const LOCALES = ["es", "en"] as const;
export type Locale = (typeof LOCALES)[number];

/** Argentina-first: used when the browser asks for no supported language. */
export const DEFAULT_LOCALE: Locale = "es";

/** Cookie that holds a manual choice; absent means "follow the browser". */
export const LOCALE_COOKIE = "NEXT_LOCALE";

/** Request header proxy.ts sets, for code that can't use next/root-params (Server Actions). */
export const LOCALE_HEADER = "x-locale";

export function isLocale(value: unknown): value is Locale {
  return (LOCALES as readonly unknown[]).includes(value);
}

/** Supported languages from an Accept-Language header, best first. */
function browserLocales(header: string): Locale[] {
  return header
    .split(",")
    .map((part, index) => {
      const [tag = "", ...params] = part.trim().split(";");
      const q = params.map((p) => p.trim()).find((p) => p.startsWith("q="));
      return { language: tag.split("-")[0]!.toLowerCase(), q: q ? Number(q.slice(2)) : 1, index };
    })
    .filter((entry) => entry.q > 0 && !Number.isNaN(entry.q))
    .sort((a, b) => b.q - a.q || a.index - b.index)
    .map((entry) => entry.language)
    .filter(isLocale);
}

/** A saved choice wins; otherwise the browser's preference; otherwise Spanish. */
export function negotiateLocale({
  cookie,
  acceptLanguage,
}: {
  cookie?: string | null;
  acceptLanguage?: string | null;
}): Locale {
  if (isLocale(cookie)) return cookie;
  return browserLocales(acceptLanguage ?? "")[0] ?? DEFAULT_LOCALE;
}
