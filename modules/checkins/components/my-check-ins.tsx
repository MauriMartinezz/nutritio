import { getOwnCheckIns } from "../dal";
import { describeCheckInStatus } from "../rules";
import { CheckInForm } from "./check-in-form";
import { CheckInHistory } from "./check-in-history";
import { WeightChart } from "./weight-chart";
import { callout, card, h2, h3, muted } from "@/modules/ui/classes";

/** The signed-in client's check-ins, per nutritionist. Render inside <Suspense>. */
export async function MyCheckIns() {
  const links = await getOwnCheckIns();

  if (links.length === 0) {
    return (
      <p className={muted}>You have no active nutritionist to send check-ins to.</p>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {links.map(({ linkId, nutritionistName, checkIns, due, askCycle, measurements, ...status }) => (
        <section key={linkId} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <h2 className={h2}>{nutritionistName}</h2>
            <p
              className={
                status.state === "DUE" ? `${callout("warning")} font-medium` : muted
              }
            >
              {describeCheckInStatus(status)}
              {due && status.state === "UPCOMING" && ` (${due.toLocaleDateString()})`}
            </p>
          </div>
          <div className={card}>
            <CheckInForm linkId={linkId} askCycle={askCycle} measurements={measurements} />
          </div>
          <div className={card}>
            <h3 className={h3}>History</h3>
            <WeightChart
              series={checkIns
                .map((checkIn) => ({ date: checkIn.createdAt, weightKg: checkIn.weightKg }))
                .reverse()}
            />
            <CheckInHistory checkIns={checkIns} />
          </div>
        </section>
      ))}
    </div>
  );
}
