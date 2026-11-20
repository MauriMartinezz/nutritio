import { test } from "node:test";
import assert from "node:assert/strict";
import { accessDaysLeft, describeAccess } from "./access-summary";

const now = new Date("2026-11-13T12:00:00Z");

test("accessDaysLeft rounds the remaining time up", () => {
  assert.equal(accessDaysLeft(new Date("2026-11-14T12:00:00Z"), now), 1);
  assert.equal(accessDaysLeft(new Date("2026-11-14T13:00:00Z"), now), 2);
  assert.equal(accessDaysLeft(new Date("2026-11-13T12:00:01Z"), now), 1);
  assert.equal(accessDaysLeft(now, now), 0);
  assert.equal(accessDaysLeft(null, now), 0);
});

test("describeAccess reads days left or asks to renew", () => {
  assert.equal(describeAccess({ expired: false, daysLeft: 12 }, "Ana"), "12 days of access left");
  assert.equal(describeAccess({ expired: false, daysLeft: 1 }, "Ana"), "1 day of access left");
  assert.equal(describeAccess({ expired: true, daysLeft: 0 }, "Ana"), "Access expired — ask Ana to renew");
});

test("describeAccess speaks Spanish", () => {
  assert.equal(describeAccess({ expired: false, daysLeft: 12 }, "Ana", "es"), "Quedan 12 días de acceso");
  assert.equal(describeAccess({ expired: false, daysLeft: 1 }, "Ana", "es"), "Queda 1 día de acceso");
  assert.equal(describeAccess({ expired: true, daysLeft: 0 }, "Ana", "es"), "Acceso vencido: pedile a Ana que lo renueve");
});
