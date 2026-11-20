// Translations live next to each module as `messages.ts`, built with defineMessages.
import type { Locale } from "./negotiate";

type Message =
  | string
  | ((...args: never[]) => string)
  | readonly Message[]
  | { readonly [key: string]: Message };

/** The shape another language must follow: same keys, any wording. */
type Widen<T> = T extends string
  ? string
  : T extends (...args: never[]) => string
    ? T
    : T extends readonly (infer Item)[]
      ? readonly Widen<Item>[]
      : { readonly [K in keyof T]: Widen<T[K]> };

export type Translations<T> = Record<Locale, Widen<T>>;

/** Declares a module's messages: `defineMessages({ en: {...}, es: {...} })`. Spanish must have every English key. */
export function defineMessages<const T extends Record<string, Message>>(messages: {
  en: T;
  es: NoInfer<Widen<T>>;
}): Translations<T> {
  return messages as Translations<T>;
}
