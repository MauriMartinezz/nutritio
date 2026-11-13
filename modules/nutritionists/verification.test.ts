import { test } from "node:test";
import assert from "node:assert/strict";
import {
  InvalidAdminUpdateError,
  InvalidVerificationError,
  changeNutritionistStatus,
  parseAdminNutritionistUpdate,
} from "./verification";

const today = new Date("2026-11-13T12:00:00Z");

test("an admin approves or rejects a pending nutritionist", () => {
  const pending = { role: "NUTRITIONIST", nutritionistStatus: "PENDING" } as const;
  assert.equal(changeNutritionistStatus(pending, "APPROVED"), "APPROVED");
  assert.equal(changeNutritionistStatus(pending, "REJECTED"), "REJECTED");
});

test("an admin can revoke an approved nutritionist and re-approve a rejected one", () => {
  assert.equal(
    changeNutritionistStatus({ role: "NUTRITIONIST", nutritionistStatus: "APPROVED" }, "REJECTED"),
    "REJECTED",
  );
  assert.equal(
    changeNutritionistStatus({ role: "NUTRITIONIST", nutritionistStatus: "REJECTED" }, "APPROVED"),
    "APPROVED",
  );
  assert.equal(
    changeNutritionistStatus({ role: "NUTRITIONIST", nutritionistStatus: "APPROVED" }, "PENDING"),
    "PENDING",
  );
});

test("only nutritionists have a verification status", () => {
  assert.throws(
    () => changeNutritionistStatus({ role: "CLIENT", nutritionistStatus: null }, "APPROVED"),
    InvalidVerificationError,
  );
  assert.throws(
    () => changeNutritionistStatus({ role: "ADMIN", nutritionistStatus: null }, "APPROVED"),
    InvalidVerificationError,
  );
});

test("an unknown status is rejected", () => {
  assert.throws(
    () =>
      changeNutritionistStatus({ role: "NUTRITIONIST", nutritionistStatus: "PENDING" }, "BANNED"),
    InvalidVerificationError,
  );
});

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
