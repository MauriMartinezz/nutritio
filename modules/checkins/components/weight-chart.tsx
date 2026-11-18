import { describeWeightSeries, formatKg, type WeightPoint } from "../weight-chart";
import { TrendChart } from "./trend-chart";

/** Weight evolution. `series` is oldest first. */
export function WeightChart({ series }: { series: WeightPoint[] }) {
  return (
    <TrendChart
      series={series.map((point) => ({ date: point.date, value: point.weightKg }))}
      format={formatKg}
      summary={describeWeightSeries(series)}
      name="Weight"
    />
  );
}
