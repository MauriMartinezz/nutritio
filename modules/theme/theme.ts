// Light/dark theme chosen by the user, persisted in localStorage only (no database).
// Until the user picks one, the theme follows the system preference.

export const THEMES = ["light", "dark"] as const;
export type Theme = (typeof THEMES)[number];
export const THEME_STORAGE_KEY = "nutritio-theme";

export function isTheme(value: unknown): value is Theme {
  return (THEMES as readonly unknown[]).includes(value);
}

/** The stored theme if valid, else the system preference. */
export function resolveTheme(stored: unknown, systemPrefersDark: boolean): Theme {
  if (isTheme(stored)) return stored;
  return systemPrefersDark ? "dark" : "light";
}

/**
 * Inline script for <head>: sets data-theme on <html> before the first paint so
 * there is no flash of the wrong theme. Storage can throw (private mode), hence try.
 */
export const themeInitScript = `(function(){try{var t=localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY,
)});}catch(e){}var d=document.documentElement;d.dataset.theme=t==="light"||t==="dark"?t:(window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");})();`;
