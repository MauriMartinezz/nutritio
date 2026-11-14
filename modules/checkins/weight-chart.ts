// Pure helpers for the weight evolution chart (no React, so they are testable).

export type WeightPoint = { date: Date; weightKg: number };
export type ChartBox = { width: number; height: number; padding: number };

const round2 = (value: number) => Math.round(value * 100) / 100;

/** "71.5 kg", "70 kg". */
export const formatKg = (weightKg: number) => `${round2(weightKg)} kg`;

/** Y axis bounds: the data range padded a little and rounded to whole kilograms. */
export function weightAxis(values: number[]): { min: number; max: number } {
  const low = Math.min(...values);
  const high = Math.max(...values);
  const pad = Math.max(0.5, (high - low) * 0.1);
  return { min: Math.floor(low - pad), max: Math.ceil(high + pad) };
}

/** SVG coordinates for an ascending series: x by date, y by weight (heavier is higher up). */
export function chartPoints(series: WeightPoint[], box: ChartBox): { x: number; y: number }[] {
  if (series.length === 0) return [];
  const { min, max } = weightAxis(series.map((point) => point.weightKg));
  const first = series[0].date.getTime();
  const span = series[series.length - 1].date.getTime() - first;
  const plotWidth = box.width - 2 * box.padding;
  const plotHeight = box.height - 2 * box.padding;

  return series.map((point) => ({
    x: round2(span === 0 ? box.width / 2 : box.padding + ((point.date.getTime() - first) / span) * plotWidth),
    y: round2(box.padding + ((max - point.weightKg) / (max - min)) * plotHeight),
  }));
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
