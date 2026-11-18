// Pure helpers for the weight evolution chart (no React, so they are testable).

import { round2, trendAxis, trendPoints, type ChartBox } from "./trend";

export type WeightPoint = { date: Date; weightKg: number };
export type { ChartBox };

/** "71.5 kg", "70 kg". */
export const formatKg = (weightKg: number) => `${round2(weightKg)} kg`;

/** Y axis bounds: the data range padded a little and rounded to whole kilograms. */
export const weightAxis = trendAxis;

/** SVG coordinates for an ascending series: x by date, y by weight (heavier is higher up). */
export function chartPoints(series: WeightPoint[], box: ChartBox): { x: number; y: number }[] {
  return trendPoints(series.map((point) => ({ date: point.date, value: point.weightKg })), box);
}

/** Accessible summary, e.g. "Weight from 74 kg to 71.5 kg over 6 check-ins". */
export function describeWeightSeries(series: WeightPoint[]): string {
  if (series.length === 0) return "No weight data yet";
  if (series.length === 1) return `Weight ${formatKg(series[0].weightKg)} from 1 check-in`;
  const first = series[0].weightKg;
  const last = series[series.length - 1].weightKg;
  return `Weight from ${formatKg(first)} to ${formatKg(last)} over ${series.length} check-ins`;
}

/** Last minus first weight, or null with fewer than two check-ins. */
export function weightChange(series: WeightPoint[]): number | null {
  if (series.length < 2) return null;
  return round2(series[series.length - 1].weightKg - series[0].weightKg);
}

/** "−2.5 kg", "+1 kg" or "No change". */
export function formatWeightChange(deltaKg: number): string {
  if (deltaKg === 0) return "No change";
  return `${deltaKg < 0 ? "−" : "+"}${formatKg(Math.abs(deltaKg))}`;
}
