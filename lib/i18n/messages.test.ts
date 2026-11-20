import { test } from "node:test";
import assert from "node:assert/strict";
import { defineMessages } from "./messages";

test("defineMessages keeps both tables and their parameterised messages", () => {
  const messages = defineMessages({
    en: { hello: "Hello", items: (count: number) => `${count} items` },
    es: { hello: "Hola", items: (count: number) => `${count} ítems` },
  });
  assert.equal(messages.es.hello, "Hola");
  assert.equal(messages.en.items(3), "3 items");
  assert.equal(messages.es.items(3), "3 ítems");
});

test("Spanish must have every English key (checked by tsc)", () => {
  const messages = defineMessages({
    en: { title: "Title", list: ["a", "b"], steps: [{ title: "One" }] },
    // @ts-expect-error: "list" and "steps" are missing in Spanish
    es: { title: "Título" },
  });
  assert.equal(messages.es.title, "Título");
});
