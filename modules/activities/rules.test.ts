import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ACTIVITY_TYPES,
  InvalidActivityError,
  activityLabel,
  dayKey,
  formatDuration,
  parseActivity,
  toDateInputValue,
  weeklySummary,
} from "./rules";

// Friday 13 November 2026, afternoon (local time).
const today = new Date(2026, 10, 13, 15, 30);
const utc = (iso: string) => new Date(`${iso}T00:00:00.000Z`);

const valid = {
  type: "FOOTBALL",
  customName: "ignored",
  performedOn: "2026-11-12",
  durationMinutes: "90",
  intensity: "HIGH",
  notes: "  Five-a-side  ",
};

test("an activity has a type, a date, minutes, an intensity and optional notes", () => {
  assert.deepEqual(parseActivity(valid, today), {
    type: "FOOTBALL",
    customName: null,
    performedOn: utc("2026-11-12"),
    durationMinutes: 90,
    intensity: "HIGH",
    notes: "Five-a-side",
  });
});

test("the user's examples are activity types: strength, gym, calisthenics, football", () => {
  for (const type of ["STRENGTH", "GYM", "CALISTHENICS", "FOOTBALL"]) {
    assert.equal(parseActivity({ ...valid, type }, today).type, type);
  }
  assert.deepEqual(Object.keys(ACTIVITY_TYPES), [
    "STRENGTH",
    "GYM",
    "CALISTHENICS",
    "FOOTBALL",
    "RUNNING",
    "CYCLING",
    "SWIMMING",
    "WALKING",
    "YOGA",
    "OTHER",
  ]);
});

test("'Other' needs a custom name of at most 60 characters; empty notes become null", () => {
  const other = parseActivity({ ...valid, type: "OTHER", customName: "  Padel ", notes: " " }, today);
  assert.equal(other.customName, "Padel");
  assert.equal(other.notes, null);
  assert.throws(
    () => parseActivity({ ...valid, type: "OTHER", customName: "  " }, today),
    (error: unknown) => error instanceof InvalidActivityError && "customName" in error.problems,
  );
  assert.throws(
    () => parseActivity({ ...valid, type: "OTHER", customName: "x".repeat(61) }, today),
    InvalidActivityError,
  );
  assert.equal(parseActivity({ ...valid, type: "OTHER", customName: "x".repeat(60) }, today).customName?.length, 60);
});

test("the date can be today or up to one year ago, never in the future", () => {
  assert.deepEqual(parseActivity({ ...valid, performedOn: "2026-11-13" }, today).performedOn, utc("2026-11-13"));
  assert.deepEqual(parseActivity({ ...valid, performedOn: "2025-11-13" }, today).performedOn, utc("2025-11-13"));
  for (const performedOn of ["2026-11-14", "2025-11-12", "2026-02-30", "13/11/2026", ""]) {
    assert.throws(() => parseActivity({ ...valid, performedOn }, today), InvalidActivityError, performedOn);
  }
});

test("an activity reports every problem at once", () => {
  try {
    parseActivity(
      { type: "DANCING", performedOn: "tomorrow", durationMinutes: "601", intensity: "EXTREME", notes: "x".repeat(501) },
      today,
    );
    assert.fail("expected InvalidActivityError");
  } catch (error) {
    assert.ok(error instanceof InvalidActivityError);
    assert.deepEqual(Object.keys(error.problems).sort(), [
      "durationMinutes",
      "intensity",
      "notes",
      "performedOn",
      "type",
    ]);
  }
  for (const durationMinutes of ["0", "1", "600", "45.5", "abc"]) {
    const ok = durationMinutes === "1" || durationMinutes === "600";
    if (ok) assert.equal(parseActivity({ ...valid, durationMinutes }, today).durationMinutes, Number(durationMinutes));
    else assert.throws(() => parseActivity({ ...valid, durationMinutes }, today), InvalidActivityError, durationMinutes);
  }
});

test("activities read with English labels, or their custom name", () => {
  assert.equal(activityLabel({ type: "STRENGTH", customName: null }), "Strength");
  assert.equal(activityLabel({ type: "GYM", customName: null }), "Gym");
  assert.equal(activityLabel({ type: "CALISTHENICS", customName: null }), "Calisthenics");
  assert.equal(activityLabel({ type: "FOOTBALL", customName: null }), "Football");
  assert.equal(activityLabel({ type: "OTHER", customName: "Padel" }), "Padel");
  assert.equal(activityLabel({ type: "OTHER", customName: null }), "Other");
});

test("the weekly summary covers Monday to Sunday of the current week", () => {
  const activities = [
    { type: "GYM" as const, performedOn: utc("2026-11-08"), durationMinutes: 999 }, // last Sunday
    { type: "GYM" as const, performedOn: utc("2026-11-09"), durationMinutes: 60 }, // Monday
    { type: "FOOTBALL" as const, performedOn: utc("2026-11-11"), durationMinutes: 90 },
    { type: "GYM" as const, performedOn: utc("2026-11-13"), durationMinutes: 45 },
  ];
  assert.deepEqual(weeklySummary(activities, today), {
    weekStart: utc("2026-11-09"),
    weekEnd: utc("2026-11-15"),
    totalMinutes: 195,
    count: 3,
    byType: [
      { type: "GYM", minutes: 105 },
      { type: "FOOTBALL", minutes: 90 },
    ],
  });
  // On a Sunday the week still started on Monday.
  assert.deepEqual(weeklySummary([], new Date(2026, 10, 15, 23)).weekStart, utc("2026-11-09"));
  assert.deepEqual(weeklySummary([], new Date(2026, 10, 16, 0, 5)).weekStart, utc("2026-11-16"));
});

test("dates helpers: local calendar day as UTC midnight, input value and readable minutes", () => {
  assert.deepEqual(dayKey(today), utc("2026-11-13"));
  assert.equal(toDateInputValue(today), "2026-11-13");
  assert.equal(formatDuration(45), "45 min");
  assert.equal(formatDuration(60), "1 h");
  assert.equal(formatDuration(195), "3 h 15 min");
});

test("in Spanish, labels and validation errors read in Spanish", () => {
  assert.equal(activityLabel({ type: "FOOTBALL", customName: null }, "es"), "Fútbol");
  assert.equal(activityLabel({ type: "OTHER", customName: "Pádel" }, "es"), "Pádel");
  try {
    parseActivity({ type: "", performedOn: "2026-11-14", durationMinutes: "0", intensity: "" }, today, "es");
    assert.fail("expected InvalidActivityError");
  } catch (error) {
    assert.ok(error instanceof InvalidActivityError);
    assert.deepEqual(error.problems, {
      type: "Elegí un tipo de actividad",
      performedOn: "La fecha tiene que estar entre hace un año y hoy",
      durationMinutes: "La duración tiene que ser un número entero de minutos entre 1 y 600",
      intensity: "Elegí una intensidad",
    });
  }
});
