// Pure helpers for the body measurement charts (no React, so they are testable).

import { MEASUREMENTS, sortMeasurementSites, type Measurement, type MeasurementSite } from "./rules";
import { trendChange, type TrendPoint } from "./trend";

export type MeasurementSeries = { site: MeasurementSite; label: string; series: TrendPoint[] };

/** "80 cm", "80.6 cm" (measurements are taken to one decimal). */
export const formatCm = (cm: number) => `${Math.round(cm * 10) / 10} cm`;

/**
 * One series per measured site, in list order, each oldest first. Takes the
 * check-ins newest first, as the history comes; sites never measured are left out.
 */
export function measurementSeries(
  newestFirst: { createdAt: Date; measurements: Measurement[] }[],
): MeasurementSeries[] {
  const bySite = new Map<MeasurementSite, TrendPoint[]>();
  for (const checkIn of [...newestFirst].reverse()) {
    for (const { site, cm } of checkIn.measurements) {
      bySite.set(site, [...(bySite.get(site) ?? []), { date: checkIn.createdAt, value: cm }]);
    }
  }
  return sortMeasurementSites([...bySite.keys()]).map((site) => ({
    site,
    label: MEASUREMENTS[site],
    series: bySite.get(site)!,
  }));
}

/** Last minus first, in cm; null with fewer than two check-ins. */
export const measurementChange = trendChange;

/** Accessible summary, e.g. "Waist from 81.5 cm to 79 cm over 2 check-ins". */
export function describeMeasurementSeries(label: string, series: TrendPoint[]): string {
  if (series.length === 1) return `${label} ${formatCm(series[0].value)} from 1 check-in`;
  const first = series[0].value;
  const last = series[series.length - 1].value;
  return `${label} from ${formatCm(first)} to ${formatCm(last)} over ${series.length} check-ins`;
}
