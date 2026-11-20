// Translations live next to each module as `messages.ts`, built with defineMessages.
import type { Locale } from "./negotiate";

type Message = string | ((...args: never[]) => string);

/** The Spanish table must have every English key, with the same parameters. */
export type Translations<T extends Record<string, Message>> = Record<Locale, T>;

/** Declares a module's messages: `defineMessages({ en: {...}, es: {...} })`. */
export function defineMessages<const T extends Record<string, Message>>(messages: {
  en: T;
  es: { [K in keyof T]: T[K] extends string ? string : T[K] };
}): Translations<T> {
  return messages as Translations<T>;
}
