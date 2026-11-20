// Pure helpers for the weight evolution chart (no React, so they are testable).

import { formatNumber } from "@/lib/i18n/format";
import type { Locale } from "@/lib/i18n/negotiate";
import { checkInRuleMessages } from "./messages";
import { round2, trendAxis, trendPoints, type ChartBox } from "./trend";

export type WeightPoint = { date: Date; weightKg: number };
export type { ChartBox };

/** "71.5 kg", "70 kg" ("71,5 kg" in Spanish). */
export const formatKg = (weightKg: number, locale: Locale = "en") =>
  `${formatNumber(round2(weightKg), locale, { maximumFractionDigits: 2 })} kg`;

/** Y axis bounds: the data range padded a little and rounded to whole kilograms. */
export const weightAxis = trendAxis;

/** SVG coordinates for an ascending series: x by date, y by weight (heavier is higher up). */
export function chartPoints(series: WeightPoint[], box: ChartBox): { x: number; y: number }[] {
  return trendPoints(series.map((point) => ({ date: point.date, value: point.weightKg })), box);
}

/** Accessible summary, e.g. "Weight from 74 kg to 71.5 kg over 6 check-ins". */
export function describeWeightSeries(series: WeightPoint[], locale: Locale = "en"): string {
  const t = checkInRuleMessages[locale];
  if (series.length === 0) return t.noWeight;
  if (series.length === 1) return t.weightOne(formatKg(series[0].weightKg, locale));
  const first = series[0].weightKg;
  const last = series[series.length - 1].weightKg;
  return t.weightRange(formatKg(first, locale), formatKg(last, locale), series.length);
}

/** Last minus first weight, or null with fewer than two check-ins. */
export function weightChange(series: WeightPoint[]): number | null {
  if (series.length < 2) return null;
  return round2(series[series.length - 1].weightKg - series[0].weightKg);
}

/** "−2.5 kg", "+1 kg" or "No change". */
export function formatWeightChange(deltaKg: number, locale: Locale = "en"): string {
  if (deltaKg === 0) return checkInRuleMessages[locale].noChange;
  return `${deltaKg < 0 ? "−" : "+"}${formatKg(Math.abs(deltaKg), locale)}`;
}
