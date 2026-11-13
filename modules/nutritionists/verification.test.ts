import { test } from "node:test";
import assert from "node:assert/strict";
import { InvalidVerificationError, decideVerification } from "./verification";

test("an admin approves a pending nutritionist", () => {
  assert.equal(
    decideVerification({ role: "NUTRITIONIST", nutritionistStatus: "PENDING" }, "APPROVE"),
    "APPROVED",
  );
});

test("an admin rejects a pending nutritionist", () => {
  assert.equal(
    decideVerification({ role: "NUTRITIONIST", nutritionistStatus: "PENDING" }, "REJECT"),
    "REJECTED",
  );
});

test("only pending nutritionists can be verified", () => {
  assert.throws(
    () => decideVerification({ role: "NUTRITIONIST", nutritionistStatus: "APPROVED" }, "REJECT"),
    InvalidVerificationError,
  );
  assert.throws(
    () => decideVerification({ role: "NUTRITIONIST", nutritionistStatus: "REJECTED" }, "APPROVE"),
    InvalidVerificationError,
  );
});

test("clients and admins cannot be verified as nutritionists", () => {
  assert.throws(
    () => decideVerification({ role: "CLIENT", nutritionistStatus: null }, "APPROVE"),
    InvalidVerificationError,
  );
  assert.throws(
    () => decideVerification({ role: "ADMIN", nutritionistStatus: null }, "APPROVE"),
    InvalidVerificationError,
  );
});
