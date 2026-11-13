import { test } from "node:test";
import assert from "node:assert/strict";
import { Prisma } from "@/generated/prisma/client";
import { uniqueViolationIndex } from "./prisma-errors";

const violation = (meta: Record<string, unknown>) =>
  new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
    code: "P2002",
    clientVersion: "7",
    meta,
  });

test("reads the violated index from the driver adapter error", () => {
  const error = violation({
    modelName: "User",
    driverAdapterError: { cause: { kind: "UniqueConstraintViolation", constraint: { index: "users_dni_key" } } },
  });
  assert.equal(uniqueViolationIndex(error), "users_dni_key");
});

test("falls back to meta.target when present", () => {
  assert.equal(uniqueViolationIndex(violation({ target: ["email"] })), "email");
});

test("returns null for errors that are not unique violations", () => {
  assert.equal(uniqueViolationIndex(new Error("boom")), null);
});
