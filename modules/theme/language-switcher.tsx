"use client";

import { useSyncExternalStore } from "react";
import { useMessages } from "@/lib/i18n/client";
import { LOCALE_COOKIE, isLocale, type Locale } from "@/lib/i18n/negotiate";
import { appearanceMessages } from "./messages";

type Choice = Locale | "auto";

// Language names are written in their own language, so anyone can find theirs.
const NAMES: Record<Locale, string> = { es: "Español", en: "English" };

function readChoice(): Choice {
  const match = document.cookie.match(new RegExp(`(?:^|; )${LOCALE_COOKIE}=([^;]*)`));
  return isLocale(match?.[1]) ? match[1] : "auto";
}

function choose(choice: Choice) {
  document.cookie =
    choice === "auto"
      ? `${LOCALE_COOKIE}=; path=/; max-age=0; samesite=lax`
      : `${LOCALE_COOKIE}=${choice}; path=/; max-age=31536000; samesite=lax`;
  // Every page is rendered in its language on the server: reload to get the new one.
  window.location.reload();
}

const noSubscribe = () => () => {};

/** Language picker: follows the browser unless a language is chosen here. */
export function LanguageSwitcher() {
  const t = useMessages(appearanceMessages);
  // null on the server: no option is shown as pressed until hydration.
  const current = useSyncExternalStore(noSubscribe, readChoice, () => null);
  const options: { value: Choice; label: string }[] = [
    { value: "auto", label: t.automatic },
    { value: "es", label: NAMES.es },
    { value: "en", label: NAMES.en },
  ];

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-sm font-semibold">{t.language}</legend>
      <div
        role="group"
        aria-label={t.language}
        className="flex w-fit flex-wrap gap-0.5 rounded-control border border-line-strong bg-surface-muted p-0.5"
      >
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={current === option.value}
            onClick={() => current !== option.value && choose(option.value)}
            lang={option.value === "auto" ? undefined : option.value}
            className="min-h-10 min-w-20 rounded-badge px-4 text-sm font-semibold text-secondary hover:text-ink aria-pressed:bg-surface aria-pressed:text-ink aria-pressed:ring-1 aria-pressed:ring-line-strong"
          >
            {option.label}
          </button>
        ))}
      </div>
      <p className="text-xs text-secondary">{t.automaticHint}</p>
    </fieldset>
  );
}
