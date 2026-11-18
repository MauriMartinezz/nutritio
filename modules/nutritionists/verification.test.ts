import { test } from "node:test";
import assert from "node:assert/strict";
import {
  InvalidAdminUpdateError,
  InvalidVerificationError,
  REVIEW_NOTE_MAX,
  parseAdminNutritionistUpdate,
  parseReviewNote,
  reviewStatus,
} from "./verification";

const today = new Date("2026-11-13T12:00:00Z");

const form = {
  name: " Sandra Pérez ",
  email: " Sandra@Example.com ",
  status: "APPROVED",
  dni: "30123456",
  licenseNumber: "MN 1234",
  birthDate: "1990-05-20",
  phone: "+54 11 5555-1234",
  specialty: "",
};

test("an admin update is validated and normalized", () => {
  assert.deepEqual(parseAdminNutritionistUpdate(form, today), {
    name: "Sandra Pérez",
    email: "sandra@example.com",
    status: "APPROVED",
    dni: "30123456",
    licenseNumber: "MN 1234",
    birthDate: new Date("1990-05-20T00:00:00.000Z"),
    phone: "+54 11 5555-1234",
    specialty: null,
  });
});

test("an admin update reports name, email, status and profile problems together", () => {
  try {
    parseAdminNutritionistUpdate(
      { ...form, name: " ", email: "not-an-email", status: "BANNED", dni: "1" },
      today,
    );
    assert.fail("expected an InvalidAdminUpdateError");
  } catch (error) {
    assert.ok(error instanceof InvalidAdminUpdateError);
    assert.deepEqual(Object.keys(error.problems).sort(), ["dni", "email", "name", "status"]);
  }
});

test("review note: trimmed, empty becomes null, at most 1000 characters", () => {
  assert.equal(parseReviewNote("  Fix the license number  "), "Fix the license number");
  assert.equal(parseReviewNote("   "), null);
  assert.equal(parseReviewNote(undefined), null);
  assert.equal(parseReviewNote("a".repeat(REVIEW_NOTE_MAX)), "a".repeat(REVIEW_NOTE_MAX));
  assert.throws(() => parseReviewNote("a".repeat(REVIEW_NOTE_MAX + 1)), InvalidVerificationError);
});

test("review decision: approve, reject or save keeps the current status", () => {
  assert.equal(reviewStatus("APPROVED", "PENDING"), "APPROVED");
  assert.equal(reviewStatus("REJECTED", "PENDING"), "REJECTED");
  assert.equal(reviewStatus("save", "REJECTED"), "REJECTED");
  assert.equal(reviewStatus("save", null), "PENDING");
  assert.throws(() => reviewStatus("ADMIN", "PENDING"), InvalidVerificationError);
});
