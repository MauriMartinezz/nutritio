import { test } from "node:test";
import assert from "node:assert/strict";
import {
  CheckInRuleError,
  InvalidCheckInError,
  checkInStatus,
  describeCheckInStatus,
  nextCheckInDue,
  parseCheckIn,
  parseFrequency,
} from "./rules";

const d = (iso: string) => new Date(iso);

const valid = {
  weightKg: "72,5",
  sleep: "4",
  trainingAdherence: "5",
  energy: "3",
  hunger: "2",
  discomfortNotes: "Knee pain",
  notes: "  Good week  ",
};

test("a check-in has a weight (comma decimal ok), four 1–5 ratings, discomfort and notes", () => {
  assert.deepEqual(parseCheckIn({ ...valid, discomfort: "on" }), {
    weightKg: 72.5,
    sleep: 4,
    trainingAdherence: 5,
    energy: 3,
    hunger: 2,
    discomfort: true,
    discomfortNotes: "Knee pain",
    notes: "Good week",
  });
});

test("discomfort notes are only kept when there was discomfort; empty notes become null", () => {
  const parsed = parseCheckIn({ ...valid, notes: "  " });
  assert.equal(parsed.discomfort, false);
  assert.equal(parsed.discomfortNotes, null);
  assert.equal(parsed.notes, null);
});

test("a check-in reports every problem at once", () => {
  try {
    parseCheckIn({
      weightKg: "19.9",
      sleep: "0",
      trainingAdherence: "6",
      energy: "3.5",
      hunger: "",
      discomfort: "on",
      discomfortNotes: "x".repeat(501),
      notes: "x".repeat(2001),
    });
    assert.fail("expected InvalidCheckInError");
  } catch (error) {
    assert.ok(error instanceof InvalidCheckInError);
    assert.deepEqual(Object.keys(error.problems).sort(), [
      "discomfortNotes",
      "energy",
      "hunger",
      "notes",
      "sleep",
      "trainingAdherence",
      "weightKg",
    ]);
  }
  for (const weightKg of ["400.01", "abc", "", "20", "400"]) {
    const ok = weightKg === "20" || weightKg === "400";
    if (ok) assert.equal(parseCheckIn({ ...valid, weightKg }).weightKg, Number(weightKg));
    else assert.throws(() => parseCheckIn({ ...valid, weightKg }), InvalidCheckInError, weightKg);
  }
});

test("the check-in frequency is a whole number of days between 1 and 90", () => {
  assert.equal(parseFrequency("7"), 7);
  assert.equal(parseFrequency(" 90 "), 90);
  assert.equal(parseFrequency("1"), 1);
  for (const value of ["0", "91", "7.5", "", "abc", null]) {
    assert.throws(() => parseFrequency(value), CheckInRuleError, String(value));
  }
});

test("the next check-in is due N days after the last check-in, or after the link start", () => {
  const link = { checkInEveryDays: 7, startedAt: d("2026-11-01T10:00:00Z") };
  assert.deepEqual(nextCheckInDue(link, null), d("2026-11-08T10:00:00Z"));
  assert.deepEqual(nextCheckInDue(link, d("2026-11-10T09:00:00Z")), d("2026-11-17T09:00:00Z"));
  assert.equal(nextCheckInDue({ ...link, checkInEveryDays: null }, d("2026-11-10T09:00:00Z")), null);
  assert.equal(nextCheckInDue({ checkInEveryDays: 7, startedAt: null }, null), null);
});

test("a check-in is due once the date is reached, otherwise upcoming in whole days", () => {
  const now = d("2026-11-13T12:00:00Z");
  assert.deepEqual(checkInStatus(null, now), { state: "NOT_SCHEDULED", daysLeft: 0 });
  assert.deepEqual(checkInStatus(d("2026-11-13T12:00:00Z"), now), { state: "DUE", daysLeft: 0 });
  assert.deepEqual(checkInStatus(d("2026-11-01T00:00:00Z"), now), { state: "DUE", daysLeft: 0 });
  assert.deepEqual(checkInStatus(d("2026-11-13T13:00:00Z"), now), { state: "UPCOMING", daysLeft: 1 });
  assert.deepEqual(checkInStatus(d("2026-11-20T12:00:00Z"), now), { state: "UPCOMING", daysLeft: 7 });
});

test("the status reads as due, days left, or not scheduled", () => {
  assert.equal(describeCheckInStatus({ state: "DUE", daysLeft: 0 }), "Check-in due");
  assert.equal(describeCheckInStatus({ state: "UPCOMING", daysLeft: 3 }), "Next check-in in 3 days");
  assert.equal(describeCheckInStatus({ state: "UPCOMING", daysLeft: 1 }), "Next check-in in 1 day");
  assert.equal(describeCheckInStatus({ state: "NOT_SCHEDULED", daysLeft: 0 }), "No check-in schedule yet");
});
