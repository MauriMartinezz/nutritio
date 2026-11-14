import { getClientCheckIns } from "../dal";
import { describeCheckInStatus } from "../rules";
import { CheckInFrequencyForm } from "./check-in-frequency-form";
import { CheckInHistory } from "./check-in-history";
import { card, h2 } from "@/modules/ui/classes";

/** A client's check-ins, for a nutritionist with an accepted link. Render inside <Suspense>. */
export async function ClientCheckIns({ params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = await params;
  const { checkIns, checkInEveryDays, due, ...status } = await getClientCheckIns(clientId);

  return (
    <section className={card}>
      <h2 className={h2}>Check-ins</h2>
      <p className="text-sm">
        {describeCheckInStatus(status)}
        {due && <span className="text-secondary">
            {" "}
            · due <span className="font-mono tabular-nums">{due.toLocaleDateString()}</span>
          </span>}
      </p>
      <CheckInFrequencyForm clientId={clientId} checkInEveryDays={checkInEveryDays} />
      <CheckInHistory checkIns={checkIns} />
    </section>
  );
}
