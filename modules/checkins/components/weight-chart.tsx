import type { Locale } from "@/lib/i18n/negotiate";
import { getLocale } from "@/lib/i18n/server";
import { checkInMessages } from "../messages";
import { describeWeightSeries, formatKg, type WeightPoint } from "../weight-chart";
import { TrendChart } from "./trend-chart";

/** Weight evolution. `series` is oldest first; `locale` defaults to the request's. Server Component. */
export async function WeightChart({ series, locale }: { series: WeightPoint[]; locale?: Locale }) {
  const active = locale ?? (await getLocale());
  return (
    <TrendChart
      series={series.map((point) => ({ date: point.date, value: point.weightKg }))}
      format={(kg) => formatKg(kg, active)}
      summary={describeWeightSeries(series, active)}
      name={checkInMessages[active].weight}
      locale={active}
    />
  );
}
