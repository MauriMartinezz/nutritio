import { buttonSecondary, input, label } from "@/modules/ui/classes";
import { setCheckInFrequency } from "../actions";
import { CHECK_IN_LIMITS, FREQUENCY_PRESETS } from "../rules";

/** The nutritionist agrees how often the client checks in. */
export function CheckInFrequencyForm({
  clientId,
  checkInEveryDays,
}: {
  clientId: string;
  checkInEveryDays: number | null;
}) {
  return (
    <form action={setCheckInFrequency.bind(null, clientId)} className="flex flex-wrap items-end gap-3">
      <label className={label}>
        Check-in every (days)
        <input
          type="number"
          name="checkInEveryDays"
          required
          min={CHECK_IN_LIMITS.minEveryDays}
          max={CHECK_IN_LIMITS.maxEveryDays}
          step={1}
          list="check-in-presets"
          defaultValue={checkInEveryDays ?? ""}
          placeholder="e.g. 7"
          className={`${input} w-32 font-mono tabular-nums`}
        />
        <datalist id="check-in-presets">
          {FREQUENCY_PRESETS.map((days) => (
            <option key={days} value={days} />
          ))}
        </datalist>
      </label>
      <button className={buttonSecondary}>
        Save frequency
      </button>
    </form>
  );
}
