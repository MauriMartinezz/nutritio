import type { Locale } from "@/lib/i18n/negotiate";
import { getLocale } from "@/lib/i18n/server";
import { h3 } from "@/modules/ui/classes";
import type { CheckInView } from "../dal";
import { describeMeasurementSeries, formatCm, formatCmChange, measurementChange, measurementSeries } from "../measurement-chart";
import { checkInMessages } from "../messages";
import { TrendChart } from "./trend-chart";

/**
 * One small chart per body measurement the client reported, in list order
 * (small multiples: each has its own scale). Nothing when none were reported.
 * `heading: false` leaves the title to the caller.
 */
export async function MeasurementCharts({
  checkIns,
  locale,
  heading = true,
}: {
  checkIns: CheckInView[];
  locale?: Locale;
  heading?: boolean;
}) {
  const active = locale ?? (await getLocale());
  const all = measurementSeries(checkIns, active);
  if (all.length === 0) return null;
  const cm = (value: number) => formatCm(value, active);

  return (
    <section className="flex flex-col gap-3" aria-labelledby={heading ? "measurement-charts" : undefined}>
      {heading && (
        <h3 id="measurement-charts" className={h3}>
          {checkInMessages[active].measurementsTitle}
        </h3>
      )}
      <div className="grid gap-5 sm:grid-cols-2">
        {all.map(({ site, label, series }) => {
          const change = measurementChange(series);
          return (
            <div key={site} className="flex flex-col gap-1">
              <p className="text-sm">
                <span className="font-medium">{label}</span>{" "}
                <span className="font-mono font-semibold tabular-nums">{cm(series[series.length - 1].value)}</span>
                {change !== null && (
                  <span className="font-mono text-secondary tabular-nums"> ({formatCmChange(change, active)})</span>
                )}
              </p>
              <TrendChart
                series={series}
                format={cm}
                // Bare numbers: the unit is in the heading, and "102 cm" overflows the axis gutter.
                formatAxis={String}
                summary={describeMeasurementSeries(label, series, active)}
                name={label}
                locale={active}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}
