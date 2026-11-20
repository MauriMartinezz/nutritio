import { getLocale } from "@/lib/i18n/server";
import { input } from "@/modules/ui/classes";
import type { AccessPeriod } from "../access";
import { coachingLabels, coachingMessages } from "../messages";

/** Amount + unit inputs (named "amount" and "unit") for an access period. */
export async function PeriodFields({
  defaultValue,
  label,
  required = true,
}: {
  defaultValue: AccessPeriod;
  label: string;
  /** False when the fields can be hidden (auto-renew off): the server validates them only when used. */
  required?: boolean;
}) {
  const locale = await getLocale();
  const t = coachingMessages[locale];
  const units = coachingLabels[locale].units;
  return (
    <>
      <input
        name="amount"
        type="number"
        required={required}
        min={1}
        max={365}
        step={1}
        defaultValue={defaultValue.amount}
        aria-label={t.periodAmount(label)}
        className={`${input} w-20 font-mono`}
      />
      <select name="unit" defaultValue={defaultValue.unit} aria-label={t.periodUnit(label)} className={input}>
        <option value="DAY">{units.DAY}</option>
        <option value="WEEK">{units.WEEK}</option>
        <option value="MONTH">{units.MONTH}</option>
      </select>
    </>
  );
}
