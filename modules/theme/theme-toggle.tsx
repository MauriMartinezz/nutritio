"use client";

import { useSyncExternalStore } from "react";
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

const OPTIONS: { value: Theme; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

/** Light/dark switch, saved in this browser only. */
export function ThemeToggle() {
  // null on the server: no option is shown as pressed until hydration.
  const theme = useSyncExternalStore(subscribe, getTheme, () => null);

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-sm font-medium">Theme</legend>
      <div role="group" aria-label="Theme" className="flex w-fit rounded-md border border-zinc-300 p-0.5 dark:border-zinc-700">
        {OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={theme === option.value}
            onClick={() => setTheme(option.value)}
            className="rounded px-3 py-1.5 text-sm aria-pressed:bg-zinc-900 aria-pressed:text-white dark:aria-pressed:bg-zinc-100 dark:aria-pressed:text-zinc-900"
          >
            {option.label}
          </button>
        ))}
      </div>
      <p className="text-xs text-zinc-500">Saved in this browser.</p>
    </fieldset>
  );
}
