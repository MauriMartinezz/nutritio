import { test } from "node:test";
import assert from "node:assert/strict";
import { describeMeasurementSeries, formatCm, measurementChange, measurementSeries } from "./measurement-chart";

const d = (iso: string) => new Date(iso);

test("measurement series: one per site with data, list order, oldest first", () => {
  // Newest first, as the history comes.
  const checkIns = [
    { createdAt: d("2026-02-10T00:00:00Z"), measurements: [{ site: "WAIST" as const, cm: 79 }, { site: "CHEST" as const, cm: 97 }] },
    { createdAt: d("2026-02-01T00:00:00Z"), measurements: [] },
    { createdAt: d("2026-01-20T00:00:00Z"), measurements: [{ site: "WAIST" as const, cm: 81.5 }] },
  ];
  assert.deepEqual(measurementSeries(checkIns), [
    { site: "CHEST", label: "Chest", series: [{ date: d("2026-02-10T00:00:00Z"), value: 97 }] },
    {
      site: "WAIST",
      label: "Waist",
      series: [
        { date: d("2026-01-20T00:00:00Z"), value: 81.5 },
        { date: d("2026-02-10T00:00:00Z"), value: 79 },
      ],
    },
  ]);
  assert.deepEqual(measurementSeries([]), []);
});

test("measurements read in cm, with a change and an accessible summary", () => {
  assert.equal(formatCm(80), "80 cm");
  assert.equal(formatCm(80.55), "80.6 cm");
  const series = [
    { date: d("2026-01-20T00:00:00Z"), value: 81.5 },
    { date: d("2026-02-10T00:00:00Z"), value: 79 },
  ];
  assert.equal(measurementChange(series), -2.5);
  assert.equal(measurementChange(series.slice(0, 1)), null);
  assert.equal(describeMeasurementSeries("Waist", series), "Waist from 81.5 cm to 79 cm over 2 check-ins");
  assert.equal(describeMeasurementSeries("Waist", series.slice(0, 1)), "Waist 81.5 cm from 1 check-in");
});

test("in Spanish, measurements use Spanish names and a decimal comma", () => {
  const series = [
    { date: d("2026-01-20T00:00:00Z"), value: 81.5 },
    { date: d("2026-02-10T00:00:00Z"), value: 79 },
  ];
  assert.equal(formatCm(80.55, "es"), "80,6 cm");
  assert.equal(measurementSeries([{ createdAt: series[0].date, measurements: [{ site: "WAIST", cm: 81.5 }] }], "es")[0].label, "Cintura");
  assert.equal(describeMeasurementSeries("Cintura", series, "es"), "Cintura de 81,5 cm a 79 cm en 2 controles");
});
