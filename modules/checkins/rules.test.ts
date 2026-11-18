import { test } from "node:test";
import assert from "node:assert/strict";
import {
  CheckInRuleError,
  InvalidCheckInError,
  checkInStatus,
  MEASUREMENTS,
  asksCycle,
  describeCheckInStatus,
  parseMeasurementSite,
  sortMeasurementSites,
  nextCheckInDue,
  parseCheckIn,
  parseFrequency,
} from "./rules";

const d = (iso: string) => new Date(iso);

const valid = {
  weightKg: "72,5",
  sleep: "4",
  completedWorkouts: "yes",
  energy: "3",
  hunger: "2",
  dietAdherence: "75",
  discomfortNotes: "Knee pain",
  notes: "  Good week  ",
};

test("a check-in has a weight (comma decimal ok), workouts yes/no, three 1–5 ratings, discomfort and notes", () => {
  assert.deepEqual(parseCheckIn({ ...valid, discomfort: "on" }), {
    weightKg: 72.5,
    completedWorkouts: true,
    gymPerformance: null,
    sleep: 4,
    energy: 3,
    hunger: 2,
    dietAdherence: 75,
    discomfort: true,
    discomfortNotes: "Knee pain",
    notes: "Good week",
    menstruating: null,
    measurements: [],
  });
});

test("completed workouts is yes or no", () => {
  assert.equal(parseCheckIn({ ...valid, completedWorkouts: "no" }).completedWorkouts, false);
  assert.throws(() => parseCheckIn({ ...valid, completedWorkouts: undefined }), InvalidCheckInError);
});

test("gym performance is optional: improved, same or dropped", () => {
  assert.equal(parseCheckIn({ ...valid, gymPerformance: "IMPROVED" }).gymPerformance, "IMPROVED");
  assert.equal(parseCheckIn({ ...valid, gymPerformance: "DROPPED" }).gymPerformance, "DROPPED");
  assert.equal(parseCheckIn({ ...valid, gymPerformance: "" }).gymPerformance, null);
  assert.throws(() => parseCheckIn({ ...valid, gymPerformance: "GREAT" }), InvalidCheckInError);
});

test("the menstrual cycle question is answered yes/no only when the nutritionist asks it", () => {
  assert.equal(parseCheckIn({ ...valid, menstruating: "yes" }).menstruating, null);
  assert.equal(parseCheckIn({ ...valid, menstruating: "yes" }, { askCycle: true }).menstruating, true);
  assert.equal(parseCheckIn({ ...valid, menstruating: "no" }, { askCycle: true }).menstruating, false);
  try {
    parseCheckIn(valid, { askCycle: true });
    assert.fail("expected InvalidCheckInError");
  } catch (error) {
    assert.ok(error instanceof InvalidCheckInError);
    assert.deepEqual(Object.keys(error.problems), ["menstruating"]);
  }
});

test("the nutritionist picks body measurements from a fixed list", () => {
  assert.deepEqual(Object.values(MEASUREMENTS), [
    "Chest",
    "Hips",
    "Thigh",
    "Arm",
    "Navel",
    "Waist",
    "3 cm below the navel",
  ]);
  assert.equal(parseMeasurementSite("WAIST"), "WAIST");
  assert.throws(() => parseMeasurementSite("NECK"), CheckInRuleError);
  assert.throws(() => parseMeasurementSite(null), CheckInRuleError);
  assert.deepEqual(sortMeasurementSites(["WAIST", "CHEST", "BELOW_NAVEL"]), ["CHEST", "WAIST", "BELOW_NAVEL"]);
});

test("requested measurements are required in cm (comma decimal ok, one decimal), in list order", () => {
  const sites = ["WAIST", "CHEST"] as const;
  assert.deepEqual(
    parseCheckIn({ ...valid, measurement_WAIST: "80,5", measurement_CHEST: "98", measurement_HIPS: "100" }, { measurements: [...sites] })
      .measurements,
    [
      { site: "CHEST", cm: 98 },
      { site: "WAIST", cm: 80.5 },
    ],
  );
  // Not requested: ignored.
  assert.deepEqual(parseCheckIn({ ...valid, measurement_WAIST: "80" }).measurements, []);
  for (const bad of ["", "9", "301", "80.55", "abc"]) {
    try {
      parseCheckIn({ ...valid, measurement_WAIST: bad }, { measurements: ["WAIST"] });
      assert.fail(`expected InvalidCheckInError for ${JSON.stringify(bad)}`);
    } catch (error) {
      assert.ok(error instanceof InvalidCheckInError);
      assert.deepEqual(error.problems, { measurement_WAIST: "Waist must be between 10 and 300 cm" });
    }
  }
});

test("the cycle question shows only to women whose nutritionist asks it", () => {
  assert.equal(asksCycle(true, "FEMALE"), true);
  assert.equal(asksCycle(false, "FEMALE"), false);
  assert.equal(asksCycle(true, "MALE"), false);
  assert.equal(asksCycle(true, null), false);
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
      completedWorkouts: "maybe",
      energy: "3.5",
      hunger: "",
      dietAdherence: "101",
      discomfort: "on",
      discomfortNotes: "x".repeat(501),
      notes: "x".repeat(2001),
    });
    assert.fail("expected InvalidCheckInError");
  } catch (error) {
    assert.ok(error instanceof InvalidCheckInError);
    assert.deepEqual(Object.keys(error.problems).sort(), [
      "completedWorkouts",
      "dietAdherence",
      "discomfortNotes",
      "energy",
      "hunger",
      "notes",
      "sleep",
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

test("diet adherence is a whole percentage from 0 to 100", () => {
  for (const value of ["0", "5", "100"]) {
    assert.equal(parseCheckIn({ ...valid, dietAdherence: value }).dietAdherence, Number(value));
  }
  for (const value of ["101", "-5", "50.5", "", "abc"]) {
    assert.throws(() => parseCheckIn({ ...valid, dietAdherence: value }), InvalidCheckInError, value);
  }
});
