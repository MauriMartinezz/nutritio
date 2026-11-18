import { test } from "node:test";
import assert from "node:assert/strict";
import { checkInKpi, latestEvents, mealSummary, nextMeeting, relativeTime, startOfMonth } from "./dashboard";

const now = new Date("2026-11-13T12:00:00Z");
const minutesAgo = (m: number) => new Date(now.getTime() - m * 60_000);

test("relativeTime reads as minutes, hours, yesterday, days, then a date", () => {
  assert.equal(relativeTime(minutesAgo(0.5), now), "Just now");
  assert.equal(relativeTime(minutesAgo(20), now), "20 min ago");
  assert.equal(relativeTime(minutesAgo(60), now), "1 h ago");
  assert.equal(relativeTime(minutesAgo(23 * 60), now), "23 h ago");
  assert.equal(relativeTime(minutesAgo(30 * 60), now), "Yesterday");
  assert.equal(relativeTime(minutesAgo(3 * 24 * 60), now), "3 days ago");
  assert.equal(relativeTime(minutesAgo(10 * 24 * 60), now), new Date(minutesAgo(10 * 24 * 60)).toLocaleDateString());
});

test("startOfMonth is the first day of the month at 00:00 UTC", () => {
  assert.deepEqual(startOfMonth(now), new Date("2026-11-01T00:00:00Z"));
});

test("latestEvents merges newest first and keeps the limit", () => {
  const events = [
    { id: "a", at: minutesAgo(30) },
    { id: "b", at: minutesAgo(5) },
    { id: "c", at: minutesAgo(90) },
    { id: "d", at: minutesAgo(1) },
  ];
  assert.deepEqual(latestEvents(events, 3).map((e) => e.id), ["d", "b", "a"]);
});

test("checkInKpi: no schedule, due now, or days until the next one", () => {
  assert.deepEqual(checkInKpi(null), { value: "—", hint: "No nutritionist yet" });
  assert.deepEqual(checkInKpi({ state: "NOT_SCHEDULED", daysLeft: 0, due: null }), { value: "—", hint: "No schedule yet" });
  assert.deepEqual(checkInKpi({ state: "DUE", daysLeft: 0, due: now }), { value: "Due", hint: "Send it today" });
  const due = new Date("2026-11-16T12:00:00Z");
  assert.deepEqual(checkInKpi({ state: "UPCOMING", daysLeft: 3, due }), { value: "3 days", hint: `On ${due.toLocaleDateString()}` });
  assert.deepEqual(checkInKpi({ state: "UPCOMING", daysLeft: 1, due }), { value: "1 day", hint: `On ${due.toLocaleDateString()}` });
});

test("mealSummary lists the first foods with grams and counts the rest", () => {
  const items = [
    { food: { label: "Oats" }, grams: 80 },
    { food: { label: "Yogurt" }, grams: 150 },
    { food: { label: "Walnuts" }, grams: 15 },
    { food: { label: "Banana" }, grams: 120 },
    { food: { label: "Honey" }, grams: 10 },
  ];
  assert.equal(mealSummary(items), "Oats 80 g · Yogurt 150 g · Walnuts 15 g + 2 more");
  assert.equal(mealSummary(items.slice(0, 2)), "Oats 80 g · Yogurt 150 g");
  assert.equal(mealSummary([]), "No foods yet");
});

test("nextMeeting is the soonest accepted meeting still ahead", () => {
  const at = (h: number) => new Date(now.getTime() + h * 3600_000);
  const meetings = [
    { status: "ACCEPTED", scheduledFor: at(-2) },
    { status: "ACCEPTED", scheduledFor: at(48) },
    { status: "PENDING", scheduledFor: null },
    { status: "ACCEPTED", scheduledFor: at(5) },
    { status: "DECLINED", scheduledFor: at(1) },
  ] as const;
  assert.deepEqual(nextMeeting([...meetings], now), meetings[3]);
  assert.equal(nextMeeting([meetings[0], meetings[2]], now), null);
});
