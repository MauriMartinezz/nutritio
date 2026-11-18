// Pure helpers shared by the evolution charts (weight, body measurements).

export type TrendPoint = { date: Date; value: number };
export type ChartBox = { width: number; height: number; padding: number };

export const round2 = (value: number) => Math.round(value * 100) / 100;

/** Y axis bounds: the data range padded a little and rounded to whole units. */
export function trendAxis(values: number[]): { min: number; max: number } {
  const low = Math.min(...values);
  const high = Math.max(...values);
  const pad = Math.max(0.5, (high - low) * 0.1);
  return { min: Math.floor(low - pad), max: Math.ceil(high + pad) };
}

/** SVG coordinates for an ascending series: x by date, y by value (higher is higher up). */
export function trendPoints(series: TrendPoint[], box: ChartBox): { x: number; y: number }[] {
  if (series.length === 0) return [];
  const { min, max } = trendAxis(series.map((point) => point.value));
  const first = series[0].date.getTime();
  const span = series[series.length - 1].date.getTime() - first;
  const plotWidth = box.width - 2 * box.padding;
  const plotHeight = box.height - 2 * box.padding;

  return series.map((point) => ({
    x: round2(span === 0 ? box.width / 2 : box.padding + ((point.date.getTime() - first) / span) * plotWidth),
    y: round2(box.padding + ((max - point.value) / (max - min)) * plotHeight),
  }));
}

/** Last minus first value, or null with fewer than two points. */
export function trendChange(series: TrendPoint[]): number | null {
  if (series.length < 2) return null;
  return round2(series[series.length - 1].value - series[0].value);
}
