import { getLocale } from "@/lib/i18n/server";
import { getClientCheckIns } from "../dal";
import { formatCheckInDate } from "../format";
import { clientCheckInMessages } from "../messages";
import { describeCheckInStatus } from "../rules";
import { CheckInFrequencyForm } from "./check-in-frequency-form";
import { CheckInHistory } from "./check-in-history";
import { CycleQuestionForm } from "./cycle-question-form";
import { MeasurementCharts } from "./measurement-charts";
import { WeightChart } from "./weight-chart";
import { MeasurementsForm } from "./measurements-form";
import { card, h2 } from "@/modules/ui/classes";

/** A client's check-ins, for a nutritionist with an accepted link. Render inside <Suspense>. */
export async function ClientCheckIns({ params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = await params;
  const [{ checkIns, checkInEveryDays, due, askCycle, clientSex, measurements, ...status }, locale] = await Promise.all([
    getClientCheckIns(clientId),
    getLocale(),
  ]);
  const t = clientCheckInMessages[locale];

  return (
    <section className={card}>
      <h2 className={h2}>{t.title}</h2>
      <p className="text-sm">
        {describeCheckInStatus(status, locale)}
        {due && <span className="text-secondary">
            {" "}
            · <span className="font-mono tabular-nums">{t.due(formatCheckInDate(due, locale))}</span>
          </span>}
      </p>
      <CheckInFrequencyForm clientId={clientId} checkInEveryDays={checkInEveryDays} />
      <CycleQuestionForm clientId={clientId} askCycle={askCycle} clientSex={clientSex} />
      <MeasurementsForm clientId={clientId} measurements={measurements} />
      <WeightChart
        locale={locale}
        series={checkIns.map((checkIn) => ({ date: checkIn.createdAt, weightKg: checkIn.weightKg })).reverse()}
      />
      <MeasurementCharts checkIns={checkIns} locale={locale} />
      <CheckInHistory checkIns={checkIns} />
    </section>
  );
}
