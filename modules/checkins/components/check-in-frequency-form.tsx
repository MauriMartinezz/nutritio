import { inputClass } from "@/modules/nutritionists/components/profile-fields";
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
    <form action={setCheckInFrequency.bind(null, clientId)} className="flex flex-wrap items-end gap-2">
      <label className="flex flex-col gap-1 text-sm">
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
          className={`${inputClass} w-32`}
        />
        <datalist id="check-in-presets">
          {FREQUENCY_PRESETS.map((days) => (
            <option key={days} value={days} />
          ))}
        </datalist>
      </label>
      <button className="rounded-md border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900">
        Save frequency
      </button>
    </form>
  );
}
