import { test } from "node:test";
import assert from "node:assert/strict";
import {
  InvalidSupportInputError,
  SUPPORT_LIMITS,
  parseAdminUserEdit,
  parseSupportReply,
  parseSupportRequest,
} from "./support";

function problemsOf(run: () => unknown) {
  try {
    run();
  } catch (error) {
    assert.ok(error instanceof InvalidSupportInputError);
    return error.problems;
  }
  assert.fail("expected an InvalidSupportInputError");
}

test("a contact request needs a title and a description, trimmed", () => {
  assert.deepEqual(
    parseSupportRequest({ title: "  I can't change my email ", description: " Help, I don't know how " }),
    { title: "I can't change my email", description: "Help, I don't know how" },
  );
  assert.deepEqual(Object.keys(problemsOf(() => parseSupportRequest({ title: " ", description: "" }))).sort(), [
    "description",
    "title",
  ]);
});

test("contact request fields have length limits", () => {
  const long = problemsOf(() =>
    parseSupportRequest({
      title: "x".repeat(SUPPORT_LIMITS.title + 1),
      description: "x".repeat(SUPPORT_LIMITS.description + 1),
    }),
  );
  assert.deepEqual(Object.keys(long).sort(), ["description", "title"]);
});

test("errors come in the requested language", () => {
  assert.equal(problemsOf(() => parseSupportRequest({}, "es")).title, "Escribí un título de hasta 120 caracteres");
  assert.equal(problemsOf(() => parseSupportRequest({}, "en")).title, "Write a title of up to 120 characters");
});

test("an admin reply is required; resolving marks the request completed", () => {
  assert.deepEqual(parseSupportReply({ reply: " Done! ", decision: "resolve" }), { reply: "Done!", resolve: true });
  assert.deepEqual(parseSupportReply({ reply: "Looking into it", decision: "reply" }), {
    reply: "Looking into it",
    resolve: false,
  });
  assert.ok(problemsOf(() => parseSupportReply({ reply: " ", decision: "resolve" })).reply);
});

test("an admin can fix a user's name and email", () => {
  assert.deepEqual(parseAdminUserEdit({ name: "  Ana   Gómez ", email: " Ana@Example.com " }), {
    name: "Ana Gómez",
    email: "ana@example.com",
  });
  assert.deepEqual(Object.keys(problemsOf(() => parseAdminUserEdit({ name: "", email: "nope" }))).sort(), [
    "email",
    "name",
  ]);
});
