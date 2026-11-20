import { test } from "node:test";
import assert from "node:assert/strict";
import { activityDashboard, favoriteActivity, signedChange, weeklyMinutes } from "./dashboard";
import type { ActivityType } from "./rules";

// Friday 13 November 2026, afternoon (local time). Its week starts Monday 9 November.
const today = new Date(2026, 10, 13, 15, 30);
const utc = (iso: string) => new Date(`${iso}T00:00:00.000Z`);
const activity = (performedOn: string, durationMinutes: number, type: ActivityType = "GYM", customName: string | null = null) => ({
  type,
  customName,
  performedOn: utc(performedOn),
  durationMinutes,
});

test("minutes per week: the last N weeks, oldest first, ending with the current week", () => {
  const weeks = weeklyMinutes(
    [
      activity("2026-11-13", 45),
      activity("2026-11-09", 60), // Monday of this week
      activity("2026-11-08", 30), // Sunday of last week
      activity("2026-11-02", 20),
      activity("2026-10-12", 999), // five weeks ago: outside a 4-week window
    ],
    today,
    4,
  );
  assert.deepEqual(weeks, [
    { weekStart: utc("2026-10-19"), minutes: 0, count: 0 },
    { weekStart: utc("2026-10-26"), minutes: 0, count: 0 },
    { weekStart: utc("2026-11-02"), minutes: 50, count: 2 },
    { weekStart: utc("2026-11-09"), minutes: 105, count: 2 },
  ]);
  assert.equal(weeklyMinutes([], today).length, 8);
});

test("the favorite activity is the most frequent one in the last 4 weeks; 'Other' groups by its name", () => {
  const recent = [
    activity("2026-11-12", 30, "OTHER", "Padel"),
    activity("2026-11-10", 30, "OTHER", " padel "),
    activity("2026-11-05", 30, "OTHER", "Tennis"),
    activity("2026-11-11", 90, "FOOTBALL"),
    activity("2026-10-01", 60, "FOOTBALL"), // older than 4 weeks: ignored
    activity("2026-10-02", 60, "FOOTBALL"),
  ];
  assert.deepEqual(favoriteActivity(recent, today), { type: "OTHER", customName: "Padel", count: 2, minutes: 60 });
  assert.equal(favoriteActivity([], today), null);
});

test("a tie in count goes to the activity with more minutes", () => {
  const tied = [activity("2026-11-12", 30, "YOGA"), activity("2026-11-11", 60, "RUNNING")];
  assert.deepEqual(favoriteActivity(tied, today), { type: "RUNNING", customName: null, count: 1, minutes: 60 });
});

test("the dashboard compares this week with last week", () => {
  const dashboard = activityDashboard(
    [activity("2026-11-12", 45), activity("2026-11-10", 30, "RUNNING"), activity("2026-11-04", 60)],
    today,
  );
  assert.equal(dashboard.thisWeek.totalMinutes, 75);
  assert.equal(dashboard.thisWeek.count, 2);
  assert.deepEqual(dashboard.lastWeek.weekStart, utc("2026-11-02"));
  assert.equal(dashboard.lastWeek.totalMinutes, 60);
  assert.equal(dashboard.lastWeek.count, 1);
  assert.equal(dashboard.weeks.length, 8);
  assert.equal(dashboard.favorite?.type, "GYM");
});

test("a week-over-week change reads with its sign; no change is null", () => {
  assert.equal(signedChange(30, String), "+30");
  assert.equal(signedChange(-75, (minutes) => `${minutes} min`), "−75 min");
  assert.equal(signedChange(0, String), null);
});
