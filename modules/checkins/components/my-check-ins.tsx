import { getOwnCheckIns } from "../dal";
import { describeCheckInStatus } from "../rules";
import { CheckInForm } from "./check-in-form";
import { CheckInHistory } from "./check-in-history";
import { WeightChart } from "./weight-chart";

/** The signed-in client's check-ins, per nutritionist. Render inside <Suspense>. */
export async function MyCheckIns() {
  const links = await getOwnCheckIns();

  if (links.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        You have no active nutritionist to send check-ins to.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-10">
      {links.map(({ linkId, nutritionistName, checkIns, due, ...status }) => (
        <section key={linkId} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold">{nutritionistName}</h2>
            <p
              className={
                status.state === "DUE" ? "text-sm font-medium text-amber-600" : "text-sm text-zinc-500"
              }
            >
              {describeCheckInStatus(status)}
              {due && status.state === "UPCOMING" && ` (${due.toLocaleDateString()})`}
            </p>
          </div>
          <CheckInForm linkId={linkId} />
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold">History</h3>
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
