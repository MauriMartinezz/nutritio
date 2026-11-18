import { h3 } from "@/modules/ui/classes";
import type { CheckInView } from "../dal";
import { describeMeasurementSeries, formatCm, measurementChange, measurementSeries } from "../measurement-chart";
import { TrendChart } from "./trend-chart";

const signed = (cm: number) => (cm === 0 ? "No change" : `${cm < 0 ? "−" : "+"}${formatCm(Math.abs(cm))}`);

/**
 * One small chart per body measurement the client reported, in list order
 * (small multiples: each has its own scale). Nothing when none were reported.
 */
export function MeasurementCharts({ checkIns }: { checkIns: CheckInView[] }) {
  const all = measurementSeries(checkIns);
  if (all.length === 0) return null;

  return (
    <section className="flex flex-col gap-3" aria-labelledby="measurement-charts">
      <h3 id="measurement-charts" className={h3}>
        Measurements
      </h3>
      <div className="grid gap-5 sm:grid-cols-2">
        {all.map(({ site, label, series }) => {
          const change = measurementChange(series);
          return (
            <div key={site} className="flex flex-col gap-1">
              <p className="text-sm">
                <span className="font-medium">{label}</span>{" "}
                <span className="font-mono font-semibold tabular-nums">{formatCm(series[series.length - 1].value)}</span>
                {change !== null && <span className="font-mono text-secondary tabular-nums"> ({signed(change)})</span>}
              </p>
              <TrendChart
                series={series}
                format={formatCm}
                // Bare numbers: the unit is in the heading, and "102 cm" overflows the axis gutter.
                formatAxis={String}
                summary={describeMeasurementSeries(label, series)}
                name={label}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}
