// Pure figures for the client's check-in dashboard: how much body weight and
// each measurement changed since the first check-in (no React, so testable).

import { sortMeasurementSites, type Measurement, type MeasurementSite } from "./rules";
import { round2 } from "./trend";

type CheckInFigures = { createdAt: Date; weightKg: number; measurements: Measurement[] };

export type WeightAt = { date: Date; weightKg: number };

export type MeasurementProgress = {
  site: MeasurementSite;
  firstCm: number;
  latestCm: number;
  /** Latest minus first; null when it was measured only once. */
  changeCm: number | null;
  /** Check-ins that recorded it. */
  count: number;
};

export type CheckInProgress = {
  count: number;
  first: WeightAt | null;
  latest: WeightAt | null;
  /** Latest minus first weight; null with fewer than two check-ins. */
  weightChangeKg: number | null;
  /** One per site ever measured, in list order. */
  measurements: MeasurementProgress[];
};

/** Takes the check-ins newest first, as the history comes. */
export function checkInProgress(newestFirst: CheckInFigures[]): CheckInProgress {
  const oldestFirst = [...newestFirst].reverse();
  const at = (checkIn: CheckInFigures | undefined): WeightAt | null =>
    checkIn ? { date: checkIn.createdAt, weightKg: checkIn.weightKg } : null;
  const first = at(oldestFirst[0]);
  const latest = at(newestFirst[0]);

  const bySite = new Map<MeasurementSite, number[]>();
  for (const checkIn of oldestFirst) {
    for (const { site, cm } of checkIn.measurements) bySite.set(site, [...(bySite.get(site) ?? []), cm]);
  }

  return {
    count: newestFirst.length,
    first,
    latest,
    weightChangeKg: first && latest && newestFirst.length > 1 ? round2(latest.weightKg - first.weightKg) : null,
    measurements: sortMeasurementSites([...bySite.keys()]).map((site) => {
      const values = bySite.get(site)!;
      const firstCm = values[0];
      const latestCm = values[values.length - 1];
      return {
        site,
        firstCm,
        latestCm,
        changeCm: values.length > 1 ? round2(latestCm - firstCm) : null,
        count: values.length,
      };
    }),
  };
}

/** For each check-in (newest first), its weight minus the previous one's; null for the oldest. */
export function weightStepChanges(newestFirst: { weightKg: number }[]): (number | null)[] {
  return newestFirst.map((checkIn, index) =>
    index === newestFirst.length - 1 ? null : round2(checkIn.weightKg - newestFirst[index + 1].weightKg),
  );
}
