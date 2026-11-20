// Pure helpers for the body measurement charts (no React, so they are testable).

import { formatNumber } from "@/lib/i18n/format";
import type { Locale } from "@/lib/i18n/negotiate";
import { checkInLabels, checkInRuleMessages } from "./messages";
import { sortMeasurementSites, type Measurement, type MeasurementSite } from "./rules";
import { trendChange, type TrendPoint } from "./trend";

export type MeasurementSeries = { site: MeasurementSite; label: string; series: TrendPoint[] };

/** "80 cm", "80.6 cm" (measurements are taken to one decimal; "80,6 cm" in Spanish). */
export const formatCm = (cm: number, locale: Locale = "en") =>
  `${formatNumber(Math.round(cm * 10) / 10, locale, { maximumFractionDigits: 1 })} cm`;

/** "−2.5 cm", "+1 cm" or "No change". */
export function formatCmChange(deltaCm: number, locale: Locale = "en"): string {
  if (deltaCm === 0) return checkInRuleMessages[locale].noChange;
  return `${deltaCm < 0 ? "−" : "+"}${formatCm(Math.abs(deltaCm), locale)}`;
}

/**
 * One series per measured site, in list order, each oldest first. Takes the
 * check-ins newest first, as the history comes; sites never measured are left out.
 */
export function measurementSeries(
  newestFirst: { createdAt: Date; measurements: Measurement[] }[],
  locale: Locale = "en",
): MeasurementSeries[] {
  const bySite = new Map<MeasurementSite, TrendPoint[]>();
  for (const checkIn of [...newestFirst].reverse()) {
    for (const { site, cm } of checkIn.measurements) {
      bySite.set(site, [...(bySite.get(site) ?? []), { date: checkIn.createdAt, value: cm }]);
    }
  }
  return sortMeasurementSites([...bySite.keys()]).map((site) => ({
    site,
    label: checkInLabels[locale].measurements[site],
    series: bySite.get(site)!,
  }));
}

/** Last minus first, in cm; null with fewer than two check-ins. */
export const measurementChange = trendChange;

/** Accessible summary, e.g. "Waist from 81.5 cm to 79 cm over 2 check-ins". */
export function describeMeasurementSeries(label: string, series: TrendPoint[], locale: Locale = "en"): string {
  const t = checkInRuleMessages[locale];
  if (series.length === 1) return t.measurementOne(label, formatCm(series[0].value, locale));
  const first = series[0].value;
  const last = series[series.length - 1].value;
  return t.measurementRange(label, formatCm(first, locale), formatCm(last, locale), series.length);
}
