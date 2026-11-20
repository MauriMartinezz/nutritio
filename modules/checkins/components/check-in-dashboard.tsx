import type { Locale } from "@/lib/i18n/negotiate";
import { card, cardSm, h3, kpi, muted } from "@/modules/ui/classes";
import type { CheckInView } from "../dal";
import { formatCheckInDate } from "../format";
import { formatCm, formatCmChange } from "../measurement-chart";
import { checkInLabels, checkInMessages } from "../messages";
import { checkInProgress } from "../progress";
import { formatKg, formatWeightChange } from "../weight-chart";
import { MeasurementCharts } from "./measurement-charts";
import { WeightChart } from "./weight-chart";

function Tile({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className={`${cardSm} gap-2`}>
      <dt className="text-sm font-medium text-secondary">{label}</dt>
      <dd className={kpi}>{value}</dd>
      <dd className="text-xs text-tertiary">{hint}</dd>
    </div>
  );
}

/**
 * How the client's body changed with one nutritionist: current weight, change
 * since the first check-in, weight chart and each measurement. Server Component.
 */
export function CheckInDashboard({ checkIns, locale }: { checkIns: CheckInView[]; locale: Locale }) {
  const t = checkInMessages[locale];
  const { count, first, latest, weightChangeKg, measurements } = checkInProgress(checkIns);
  if (!first || !latest) return <p className={`${card} ${muted}`}>{t.noDataYet}</p>;
  const day = (date: Date) => formatCheckInDate(date, locale);

  return (
    <div className="flex flex-col gap-4">
      <dl className="grid gap-3 sm:grid-cols-3">
        <Tile label={t.currentWeight} value={formatKg(latest.weightKg, locale)} hint={t.weighedOn(day(latest.date))} />
        <Tile
          label={t.sinceStart}
          value={weightChangeKg === null ? "—" : formatWeightChange(weightChangeKg, locale)}
          hint={weightChangeKg === null ? t.oneCheckInHint : t.sinceDate(day(first.date))}
        />
        <Tile label={t.checkInsCount} value={String(count)} hint={t.firstOn(day(first.date))} />
      </dl>
      <section className={card} aria-label={t.weightOverTime}>
        <h3 className={h3}>{t.weightOverTime}</h3>
        <WeightChart
          locale={locale}
          series={[...checkIns].reverse().map((checkIn) => ({ date: checkIn.createdAt, weightKg: checkIn.weightKg }))}
        />
      </section>
      {measurements.length > 0 && (
        <section className={card} aria-label={t.measurementsTitle}>
          <h3 className={h3}>{t.measurementsTitle}</h3>
          <table className="w-full text-sm">
            <thead className="border-b border-line text-left text-xs text-secondary">
              <tr>
                <th scope="col" className="pb-2 pr-3 font-medium">
                  {t.measurement}
                </th>
                {[t.firstValue, t.nowValue, t.change].map((heading) => (
                  <th key={heading} scope="col" className="px-3 pb-2 text-right font-medium last:pr-0">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-divider">
              {measurements.map((m) => (
                <tr key={m.site}>
                  <th scope="row" className="py-2.5 pr-3 text-left font-medium">
                    {checkInLabels[locale].measurements[m.site]}
                  </th>
                  <td className="px-3 py-2.5 text-right font-mono tabular-nums text-secondary">{formatCm(m.firstCm, locale)}</td>
                  <td className="px-3 py-2.5 text-right font-mono font-semibold tabular-nums">{formatCm(m.latestCm, locale)}</td>
                  <td className="py-2.5 pl-3 text-right font-mono tabular-nums">
                    {m.changeCm === null ? <span className="text-tertiary">—</span> : formatCmChange(m.changeCm, locale)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <details className="group">
            <summary className="inline-flex min-h-11 cursor-pointer items-center text-sm font-semibold text-accent hover:text-accent-hover">
              {t.seeCharts}
            </summary>
            <div className="pt-2">
              <MeasurementCharts checkIns={checkIns} locale={locale} heading={false} />
            </div>
          </details>
        </section>
      )}
    </div>
  );
}
