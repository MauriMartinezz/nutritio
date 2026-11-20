import { test } from "node:test";
import assert from "node:assert/strict";
import { activeClientsLabel, countActiveClients } from "./directory";

const now = new Date("2026-11-14T12:00:00Z");
const link = (accessUntil: string | null, autoRenew = false) => ({
  accessUntil: accessUntil ? new Date(accessUntil) : null,
  autoRenew,
  accessAmount: 1,
  accessUnit: "MONTH" as const,
});

test("only accepted links with access in force count as active clients", () => {
  assert.equal(
    countActiveClients(
      [
        link("2026-12-01T00:00:00Z"),
        link("2026-11-01T00:00:00Z"),
        link("2026-11-01T00:00:00Z", true),
        link(null),
      ],
      now,
    ),
    2,
  );
  assert.equal(countActiveClients([], now), 0);
});

test("active clients label", () => {
  assert.equal(activeClientsLabel(0), "No active clients yet");
  assert.equal(activeClientsLabel(1), "1 active client");
  assert.equal(activeClientsLabel(12), "12 active clients");
});

test("active clients label in Spanish", () => {
  assert.equal(activeClientsLabel(0, "es"), "Todavía sin pacientes activos");
  assert.equal(activeClientsLabel(1, "es"), "1 paciente activo");
  assert.equal(activeClientsLabel(12, "es"), "12 pacientes activos");
});
