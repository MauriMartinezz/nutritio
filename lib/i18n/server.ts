import "server-only";
import { headers } from "next/headers";
import { lang } from "next/root-params";
import { DEFAULT_LOCALE, LOCALE_HEADER, isLocale, type Locale } from "./negotiate";

/** The active locale in Server Components (from the app/[lang] root segment). */
export async function getLocale(): Promise<Locale> {
  const value = await lang();
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

/** A module's messages in the active locale, for Server Components. */
export async function getMessages<T>(messages: Record<Locale, T>): Promise<T> {
  return (messages as Record<Locale, T>)[await getLocale()];
}

/** The active locale in Server Actions, where next/root-params is unavailable (set by proxy.ts). */
export async function getActionLocale(): Promise<Locale> {
  const value = (await headers()).get(LOCALE_HEADER);
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

/** A module's messages in the active locale, for Server Actions. */
export async function getActionMessages<T>(messages: Record<Locale, T>): Promise<T> {
  return messages[await getActionLocale()];
}
