import { test } from "node:test";
import assert from "node:assert/strict";
import { latestEvents, relativeTime, startOfMonth } from "./dashboard";

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
