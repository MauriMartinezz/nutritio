import { test } from "node:test";
import assert from "node:assert/strict";
import {
  chartPoints,
  describeWeightSeries,
  formatKg,
  formatWeightChange,
  weightAxis,
  weightChange,
} from "./weight-chart";

const d = (iso: string) => new Date(iso);
const series = [
  { date: d("2026-01-10T00:00:00Z"), weightKg: 74 },
  { date: d("2026-01-20T00:00:00Z"), weightKg: 73 },
  { date: d("2026-01-30T00:00:00Z"), weightKg: 71.5 },
];

test("weightAxis pads the range and rounds to whole kilograms", () => {
  assert.deepEqual(weightAxis([74, 73, 71.5]), { min: 71, max: 75 });
  // A flat series still gets a visible range.
  assert.deepEqual(weightAxis([70, 70]), { min: 69, max: 71 });
});

test("chartPoints maps time to x and weight to y (higher weight is higher up)", () => {
  const box = { width: 100, height: 50, padding: 10 };
  const points = chartPoints(series, box);
  assert.equal(points.length, 3);
  assert.equal(points[0].x, 10);
  assert.equal(points[1].x, 50);
  assert.equal(points[2].x, 90);
  // axis 71..75 over y 40 (bottom) .. 10 (top)
  assert.equal(points[0].y, 17.5);
  assert.equal(points[2].y, 36.25);
  assert.ok(points[0].y < points[2].y);
});

test("chartPoints centres a single point", () => {
  const [point] = chartPoints([series[0]], { width: 100, height: 50, padding: 10 });
  assert.equal(point.x, 50);
  assert.equal(point.y, 25);
});

test("describeWeightSeries summarises the series", () => {
  assert.equal(describeWeightSeries(series), "Weight from 74 kg to 71.5 kg over 3 check-ins");
  assert.equal(describeWeightSeries([series[0]]), "Weight 74 kg from 1 check-in");
  assert.equal(describeWeightSeries([]), "No weight data yet");
});

test("weightChange is last minus first, without float noise", () => {
  assert.equal(weightChange(series), -2.5);
  assert.equal(weightChange([{ date: d("2026-01-01"), weightKg: 70.1 }, { date: d("2026-01-02"), weightKg: 70.3 }]), 0.2);
  assert.equal(weightChange([series[0]]), null);
  assert.equal(weightChange([]), null);
});

test("formatWeightChange uses a true minus sign and an explicit plus", () => {
  assert.equal(formatWeightChange(-2.5), "−2.5 kg");
  assert.equal(formatWeightChange(1), "+1 kg");
  assert.equal(formatWeightChange(0), "No change");
});

test("formatKg drops trailing zeros", () => {
  assert.equal(formatKg(71.5), "71.5 kg");
  assert.equal(formatKg(70), "70 kg");
  assert.equal(formatKg(70.25), "70.25 kg");
});

test("in Spanish, weights use a decimal comma", () => {
  assert.equal(formatKg(71.5, "es"), "71,5 kg");
  assert.equal(formatWeightChange(-2.5, "es"), "−2,5 kg");
  assert.equal(formatWeightChange(0, "es"), "Sin cambios");
  assert.equal(describeWeightSeries(series, "es"), "Peso de 74 kg a 71,5 kg en 3 controles");
  assert.equal(describeWeightSeries([series[0]], "es"), "Peso 74 kg en 1 control");
});
