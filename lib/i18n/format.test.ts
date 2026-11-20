import { test } from "node:test";
import assert from "node:assert/strict";
import { formatDay, formatNumber } from "./format";

test("Spanish formats Argentine-style, English US-style", () => {
  const day = new Date("1990-05-20T00:00:00.000Z");
  assert.equal(formatDay(day, "es"), "20/5/1990");
  assert.equal(formatDay(day, "es", { day: "2-digit", month: "2-digit", year: "numeric" }), "20/05/1990");
  assert.equal(formatDay(day, "en"), "5/20/1990");
  assert.equal(formatNumber(1234.5, "es"), "1.234,5");
  assert.equal(formatNumber(1234.5, "en"), "1,234.5");
});
