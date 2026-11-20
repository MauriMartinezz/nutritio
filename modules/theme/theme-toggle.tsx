"use client";

import { useSyncExternalStore } from "react";
import { useMessages } from "@/lib/i18n/client";
import { appearanceMessages } from "./messages";
import { THEME_STORAGE_KEY, resolveTheme, type Theme } from "./theme";

// <html data-theme> is the source of truth (set before paint by themeInitScript).
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}

const getTheme = (): Theme =>
  resolveTheme(document.documentElement.dataset.theme, window.matchMedia("(prefers-color-scheme: dark)").matches);

function setTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Storage blocked (private mode): the theme still applies for this visit.
  }
}


/** Light/dark switch, saved in this browser only. */
export function ThemeToggle() {
  // null on the server: no option is shown as pressed until hydration.
  const theme = useSyncExternalStore(subscribe, getTheme, () => null);
  const t = useMessages(appearanceMessages);
  const options: { value: Theme; label: string }[] = [
    { value: "light", label: t.light },
    { value: "dark", label: t.dark },
  ];

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-sm font-semibold">{t.theme}</legend>
      <div
        role="group"
        aria-label={t.theme}
        className="flex w-fit gap-0.5 rounded-control border border-line-strong bg-surface-muted p-0.5"
      >
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={theme === option.value}
            onClick={() => setTheme(option.value)}
            className="min-h-10 min-w-20 rounded-badge px-4 text-sm font-semibold text-secondary hover:text-ink aria-pressed:bg-surface aria-pressed:text-ink aria-pressed:ring-1 aria-pressed:ring-line-strong"
          >
            {option.label}
          </button>
        ))}
      </div>
      <p className="text-xs text-secondary">{t.savedInBrowser}</p>
    </fieldset>
  );
}
