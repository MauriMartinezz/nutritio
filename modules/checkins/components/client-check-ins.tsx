import { getClientCheckIns } from "../dal";
import { describeCheckInStatus } from "../rules";
import { CheckInFrequencyForm } from "./check-in-frequency-form";
import { CheckInHistory } from "./check-in-history";

/** A client's check-ins, for a nutritionist with an accepted link. Render inside <Suspense>. */
export async function ClientCheckIns({ params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = await params;
  const { checkIns, checkInEveryDays, due, ...status } = await getClientCheckIns(clientId);

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold">Check-ins</h2>
      <p className="text-sm">
        {describeCheckInStatus(status)}
        {due && <span className="text-zinc-500"> · due {due.toLocaleDateString()}</span>}
      </p>
      <CheckInFrequencyForm clientId={clientId} checkInEveryDays={checkInEveryDays} />
      <CheckInHistory checkIns={checkIns} />
    </section>
  );
}
