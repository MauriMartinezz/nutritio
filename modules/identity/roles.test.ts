import { test } from "node:test";
import assert from "node:assert/strict";
import {
  InvalidRoleError,
  PrivilegedFieldChangeError,
  assertNoPrivilegedChanges,
  prepareNewUser,
} from "./roles";

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

test("a new nutritionist starts pending admin verification", () => {
  assert.deepEqual(prepareNewUser({ role: "NUTRITIONIST" }), {
    role: "NUTRITIONIST",
    nutritionistStatus: "PENDING",
  });
});

test("nobody can self-assign ADMIN or an unknown role at sign-up", () => {
  assert.throws(() => prepareNewUser({ role: "ADMIN" }), InvalidRoleError);
  assert.throws(() => prepareNewUser({ role: "SUPERUSER" }), InvalidRoleError);
});

test("a nutritionist cannot pre-approve themselves at sign-up", () => {
  assert.deepEqual(
    prepareNewUser({ role: "NUTRITIONIST", nutritionistStatus: "APPROVED" }),
    { role: "NUTRITIONIST", nutritionistStatus: "PENDING" },
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
});
