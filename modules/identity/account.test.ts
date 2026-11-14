import assert from "node:assert/strict";
import { test } from "node:test";
import { InvalidDisplayNameError, MAX_NAME_LENGTH, normalizeNameUpdate, parseDisplayName } from "./account";

test("parseDisplayName trims and collapses inner whitespace", () => {
  assert.equal(parseDisplayName("  Ana   María  López "), "Ana María López");
});

test("parseDisplayName rejects empty, blank and non-string names", () => {
  for (const raw of ["", "   ", undefined, null, 42]) {
    assert.throws(() => parseDisplayName(raw), InvalidDisplayNameError);
  }
});

test("parseDisplayName accepts the maximum length and rejects longer names", () => {
  assert.equal(parseDisplayName("a".repeat(MAX_NAME_LENGTH)).length, MAX_NAME_LENGTH);
  assert.throws(() => parseDisplayName("a".repeat(MAX_NAME_LENGTH + 1)), InvalidDisplayNameError);
});

test("normalizeNameUpdate passes updates without a name through unchanged", () => {
  assert.equal(normalizeNameUpdate({ image: "https://x/y.png", name: undefined }), undefined);
  assert.equal(normalizeNameUpdate({ emailVerified: true }), undefined);
});

test("normalizeNameUpdate normalizes a sent name and rejects an invalid one", () => {
  assert.deepEqual(normalizeNameUpdate({ name: " Ana  Pérez ", image: undefined }), {
    data: { name: "Ana Pérez", image: undefined },
  });
  assert.throws(() => normalizeNameUpdate({ name: "  " }), InvalidDisplayNameError);
});
