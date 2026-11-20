"use client";

import { createContext, useContext } from "react";
import { DEFAULT_LOCALE, type Locale } from "./negotiate";

const LocaleContext = createContext<Locale>(DEFAULT_LOCALE);

/** Set once in the root layout with the locale of the current request. */
export function LocaleProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return <LocaleContext value={locale}>{children}</LocaleContext>;
}

export function useLocale(): Locale {
  return useContext(LocaleContext);
}

/** A module's messages in the active locale, for Client Components. */
export function useMessages<T>(messages: Record<Locale, T>): T {
  return messages[useLocale()];
}
