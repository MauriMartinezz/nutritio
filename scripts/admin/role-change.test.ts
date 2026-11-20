import assert from "node:assert/strict";
import { test } from "node:test";
import { InvalidTargetRoleError, roleChange } from "./role-change";

const now = new Date("2026-11-20T12:00:00Z");

test("CLIENT drops the nutritionist verification state", () => {
  assert.deepEqual(roleChange("CLIENT", now), {
    role: "CLIENT",
    nutritionistStatus: null,
    verificationNote: null,
    reviewedAt: null,
  });
});

test("NUTRITIONIST is approved right away", () => {
  assert.deepEqual(roleChange("NUTRITIONIST", now), {
    role: "NUTRITIONIST",
    nutritionistStatus: "APPROVED",
    verificationNote: null,
    reviewedAt: now,
  });
});

test("ADMIN matches admin:promote", () => {
  assert.deepEqual(roleChange("ADMIN", now), { role: "ADMIN", nutritionistStatus: null });
});

test("role names are case-insensitive", () => {
  assert.equal(roleChange("client", now).role, "CLIENT");
});

test("unknown roles are rejected", () => {
  assert.throws(() => roleChange("SUPERUSER", now), InvalidTargetRoleError);
  assert.throws(() => roleChange(undefined, now), InvalidTargetRoleError);
});
