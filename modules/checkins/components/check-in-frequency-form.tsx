import { getMessages } from "@/lib/i18n/server";
import { buttonSecondary, input, label } from "@/modules/ui/classes";
import { setCheckInFrequency } from "../actions";
import { clientCheckInMessages } from "../messages";
import { CHECK_IN_LIMITS, FREQUENCY_PRESETS } from "../rules";

/** The nutritionist agrees how often the client checks in. */
export async function CheckInFrequencyForm({
  clientId,
  checkInEveryDays,
}: {
  clientId: string;
  checkInEveryDays: number | null;
}) {
  const t = await getMessages(clientCheckInMessages);
  return (
    <form action={setCheckInFrequency.bind(null, clientId)} className="flex flex-wrap items-end gap-3">
      <label className={label}>
        {t.everyDays}
        <input
          type="number"
          name="checkInEveryDays"
          required
          min={CHECK_IN_LIMITS.minEveryDays}
          max={CHECK_IN_LIMITS.maxEveryDays}
          step={1}
          list="check-in-presets"
          defaultValue={checkInEveryDays ?? ""}
          placeholder={t.everyDaysPlaceholder}
          className={`${input} w-32 font-mono tabular-nums`}
        />
        <datalist id="check-in-presets">
          {FREQUENCY_PRESETS.map((days) => (
            <option key={days} value={days} />
          ))}
        </datalist>
      </label>
      <button className={buttonSecondary}>
        {t.saveFrequency}
      </button>
    </form>
  );
}
