import { test } from "node:test";
import assert from "node:assert/strict";
import {
  AccessRuleError,
  accessState,
  addPeriod,
  effectiveAccessUntil,
  parsePeriod,
  renewAccess,
} from "./access";

const d = (iso: string) => new Date(iso);
const month = { amount: 1, unit: "MONTH" } as const;

test("a period is a whole amount of days, weeks or months", () => {
  assert.deepEqual(parsePeriod("3", "MONTH"), { amount: 3, unit: "MONTH" });
  assert.deepEqual(parsePeriod(" 10 ", "DAY"), { amount: 10, unit: "DAY" });
  for (const [amount, unit] of [["0", "DAY"], ["366", "DAY"], ["1.5", "WEEK"], ["", "MONTH"], ["2", "YEAR"]]) {
    assert.throws(() => parsePeriod(amount, unit), AccessRuleError, `${amount} ${unit}`);
  }
});

test("periods add days, weeks and calendar months", () => {
  assert.deepEqual(addPeriod(d("2026-01-10T12:00:00Z"), { amount: 10, unit: "DAY" }), d("2026-01-20T12:00:00Z"));
  assert.deepEqual(addPeriod(d("2026-01-10T12:00:00Z"), { amount: 2, unit: "WEEK" }), d("2026-01-24T12:00:00Z"));
  assert.deepEqual(addPeriod(d("2026-01-10T12:00:00Z"), { amount: 3, unit: "MONTH" }), d("2026-04-10T12:00:00Z"));
  // Jan 31 + 1 month is the last day of February, not March 3.
  assert.deepEqual(addPeriod(d("2026-01-31T12:00:00Z"), month), d("2026-02-28T12:00:00Z"));
});

const now = d("2026-11-13T12:00:00Z");

test("access is active, expiring within 7 days, or expired", () => {
  const link = (until: string) => ({ accessUntil: d(until), autoRenew: false, ...month });
  assert.equal(accessState(link("2026-12-01T00:00:00Z"), now), "ACTIVE");
  assert.equal(accessState(link("2026-11-19T00:00:00Z"), now), "EXPIRING");
  assert.equal(accessState(link("2026-11-13T11:59:59Z"), now), "EXPIRED");
  assert.equal(accessState({ accessUntil: null, autoRenew: false, ...month }, now), "EXPIRED");
});

test("automatic renewal rolls an expired end date forward by its period", () => {
  const link = { accessUntil: d("2026-09-01T00:00:00Z"), autoRenew: true, amount: 1, unit: "MONTH" as const };
  // Sep 1 → Oct 1 → Nov 1 → Dec 1 (first date after now).
  assert.deepEqual(effectiveAccessUntil(link, now), d("2026-12-01T00:00:00Z"));
  assert.equal(accessState(link, now), "ACTIVE");
  assert.deepEqual(effectiveAccessUntil({ ...link, autoRenew: false }, now), d("2026-09-01T00:00:00Z"));
});

test("renewing extends from the end date while active, or from now when expired", () => {
  const active = { accessUntil: d("2026-11-20T00:00:00Z"), autoRenew: false, ...month };
  assert.deepEqual(renewAccess(active, { amount: 2, unit: "WEEK" }, now), d("2026-12-04T00:00:00Z"));
  const expired = { accessUntil: d("2026-10-01T00:00:00Z"), autoRenew: false, ...month };
  assert.deepEqual(renewAccess(expired, month, now), d("2026-12-13T12:00:00Z"));
});

test("monthly auto-renewal keeps the original day of the month (no month-end drift)", () => {
  const link = { accessUntil: d("2026-01-31T12:00:00Z"), autoRenew: true, ...month };
  // Jan 31 → Feb 28 → … → Nov 30 (not Nov 28).
  assert.deepEqual(effectiveAccessUntil(link, d("2026-11-15T00:00:00Z")), d("2026-11-30T12:00:00Z"));
});

test("period errors read in Spanish", () => {
  assert.throws(() => parsePeriod("0", "DAY", "es"), { message: "La cantidad debe ser un número entero entre 1 y 365" });
  assert.throws(() => parsePeriod("2", "YEAR", "es"), { message: "La unidad debe ser días, semanas o meses" });
});
