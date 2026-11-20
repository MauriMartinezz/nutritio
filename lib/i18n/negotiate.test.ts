import { test } from "node:test";
import assert from "node:assert/strict";
import { localeFromHeaders, negotiateLocale } from "./negotiate";

test("the browser language picks the locale", () => {
  assert.equal(negotiateLocale({ acceptLanguage: "en-US,en;q=0.9" }), "en");
  assert.equal(negotiateLocale({ acceptLanguage: "es-AR,es;q=0.9,en;q=0.8" }), "es");
});

test("quality values decide between supported languages", () => {
  assert.equal(negotiateLocale({ acceptLanguage: "es;q=0.5,en;q=0.9" }), "en");
  assert.equal(negotiateLocale({ acceptLanguage: "fr-FR,fr;q=0.9,en;q=0.5" }), "en");
});

test("falls back to Spanish when the browser asks for neither or sends nothing", () => {
  assert.equal(negotiateLocale({ acceptLanguage: "fr-FR,de;q=0.8" }), "es");
  assert.equal(negotiateLocale({ acceptLanguage: null }), "es");
  assert.equal(negotiateLocale({ acceptLanguage: "*" }), "es");
});

test("a saved choice overrides the browser; unknown saved values are ignored", () => {
  assert.equal(negotiateLocale({ cookie: "en", acceptLanguage: "es-AR" }), "en");
  assert.equal(negotiateLocale({ cookie: "fr", acceptLanguage: "en" }), "en");
});

test("localeFromHeaders: the NEXT_LOCALE cookie wins over the browser language", () => {
  assert.equal(localeFromHeaders(new Headers({ cookie: "a=1; NEXT_LOCALE=en", "accept-language": "es-AR" })), "en");
  assert.equal(localeFromHeaders(new Headers({ "accept-language": "en-US" })), "en");
  assert.equal(localeFromHeaders(undefined), "es");
});
