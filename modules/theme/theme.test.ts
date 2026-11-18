import { test } from "node:test";
import assert from "node:assert/strict";
import { THEME_STORAGE_KEY, resolveTheme, themeInitScript } from "./theme";

test("a stored theme wins over the system preference", () => {
  assert.equal(resolveTheme("light", true), "light");
  assert.equal(resolveTheme("dark", false), "dark");
});

test("without a valid stored theme the system preference is used", () => {
  for (const stored of [null, undefined, "", "blue"]) {
    assert.equal(resolveTheme(stored, true), "dark");
    assert.equal(resolveTheme(stored, false), "light");
  }
});

function runInitScript(stored: string | null, systemDark: boolean, storageThrows = false) {
  const documentElement = { dataset: {} as Record<string, string> };
  const sandbox = {
    document: { documentElement },
    window: { matchMedia: () => ({ matches: systemDark }) },
    localStorage: {
      getItem: (key: string) => {
        if (storageThrows) throw new Error("blocked");
        return key === THEME_STORAGE_KEY ? stored : null;
      },
    },
  };
  new Function("document", "window", "localStorage", themeInitScript)(
    sandbox.document,
    sandbox.window,
    sandbox.localStorage,
  );
  return documentElement.dataset.theme;
}

test("the head script applies the stored theme before paint", () => {
  assert.equal(runInitScript("dark", false), "dark");
  assert.equal(runInitScript("light", true), "light");
});

test("the head script falls back to the system when storage is empty or blocked", () => {
  assert.equal(runInitScript(null, true), "dark");
  assert.equal(runInitScript("weird", false), "light");
  assert.equal(runInitScript(null, true, true), "dark");
});
