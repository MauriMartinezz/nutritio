import { test } from "node:test";
import assert from "node:assert/strict";
import { InvalidProfileError } from "@/modules/nutritionists/profile";
import {
  InvalidRoleError,
  PrivilegedFieldChangeError,
  UnexpectedProfileError,
  assertNoPrivilegedChanges,
  prepareNewUser,
} from "./roles";

const today = new Date("2026-11-13T12:00:00Z");
const profile = {
  dni: "30123456",
  licenseNumber: "MN 1234",
  birthDate: "1990-05-20",
  phone: "+54 11 5555 1234",
  specialty: "Sports nutrition",
};
const parsedProfile = { ...profile, birthDate: new Date("1990-05-20T00:00:00.000Z") };

test("a new user signs up as CLIENT by default", () => {
  assert.deepEqual(prepareNewUser({ role: undefined }), {
    role: "CLIENT",
    nutritionistStatus: null,
  });
});

test("a new user may sign up as CLIENT", () => {
  assert.deepEqual(prepareNewUser({ role: "CLIENT" }), {
    role: "CLIENT",
    nutritionistStatus: null,
  });
});

test("a new nutritionist starts pending admin verification with their profile", () => {
  assert.deepEqual(prepareNewUser({ role: "NUTRITIONIST", ...profile }, today), {
    role: "NUTRITIONIST",
    nutritionistStatus: "PENDING",
    ...parsedProfile,
  });
});

test("a nutritionist cannot sign up without a valid profile", () => {
  assert.throws(() => prepareNewUser({ role: "NUTRITIONIST" }, today), InvalidProfileError);
});

test("a client cannot send nutritionist profile fields", () => {
  assert.throws(
    () => prepareNewUser({ role: "CLIENT", dni: "30123456" }, today),
    UnexpectedProfileError,
  );
});

test("nobody can self-assign ADMIN or an unknown role at sign-up", () => {
  assert.throws(() => prepareNewUser({ role: "ADMIN" }), InvalidRoleError);
  assert.throws(() => prepareNewUser({ role: "SUPERUSER" }), InvalidRoleError);
});

test("a nutritionist cannot pre-approve themselves at sign-up", () => {
  assert.deepEqual(
    prepareNewUser({ role: "NUTRITIONIST", nutritionistStatus: "APPROVED", ...profile }, today),
    { role: "NUTRITIONIST", nutritionistStatus: "PENDING", ...parsedProfile },
  );
});

test("profile updates through the auth API cannot touch role or verification status", () => {
  assert.doesNotThrow(() => assertNoPrivilegedChanges({ name: "Emanuel" }));
  assert.throws(
    () => assertNoPrivilegedChanges({ role: "ADMIN" }),
    PrivilegedFieldChangeError,
  );
  assert.throws(
    () => assertNoPrivilegedChanges({ nutritionistStatus: "APPROVED" }),
    PrivilegedFieldChangeError,
  );
  for (const field of ["dni", "licenseNumber", "birthDate", "phone", "specialty"]) {
    assert.throws(() => assertNoPrivilegedChanges({ [field]: "x" }), PrivilegedFieldChangeError);
  }
});
