import { test } from "node:test";
import assert from "node:assert/strict";
import { checkInProgress, weightStepChanges } from "./progress";

const d = (iso: string) => new Date(iso);

// Newest first, as the history comes.
const checkIns = [
  {
    createdAt: d("2026-03-01T10:00:00Z"),
    weightKg: 71.5,
    measurements: [{ site: "WAIST" as const, cm: 79 }, { site: "HIPS" as const, cm: 98.5 }],
  },
  { createdAt: d("2026-02-15T10:00:00Z"), weightKg: 73, measurements: [] },
  {
    createdAt: d("2026-02-01T10:00:00Z"),
    weightKg: 74.1,
    measurements: [{ site: "WAIST" as const, cm: 81.5 }],
  },
];

test("progress: latest weight and its change since the first check-in, without float noise", () => {
  const progress = checkInProgress(checkIns);
  assert.equal(progress.count, 3);
  assert.deepEqual(progress.first, { date: d("2026-02-01T10:00:00Z"), weightKg: 74.1 });
  assert.deepEqual(progress.latest, { date: d("2026-03-01T10:00:00Z"), weightKg: 71.5 });
  assert.equal(progress.weightChangeKg, -2.6);
});

test("progress: each measurement from its first to its latest value, in list order", () => {
  assert.deepEqual(checkInProgress(checkIns).measurements, [
    { site: "HIPS", firstCm: 98.5, latestCm: 98.5, changeCm: null, count: 1 },
    { site: "WAIST", firstCm: 81.5, latestCm: 79, changeCm: -2.5, count: 2 },
  ]);
});

test("progress: one check-in has no change yet; none has no figures", () => {
  const one = checkInProgress(checkIns.slice(0, 1));
  assert.equal(one.count, 1);
  assert.equal(one.weightChangeKg, null);
  assert.deepEqual(one.first, one.latest);

  assert.deepEqual(checkInProgress([]), {
    count: 0,
    first: null,
    latest: null,
    weightChangeKg: null,
    measurements: [],
  });
});

test("weight step changes: each check-in against the one before it, null for the first", () => {
  assert.deepEqual(weightStepChanges(checkIns), [-1.5, -1.1, null]);
  assert.deepEqual(weightStepChanges([]), []);
});
