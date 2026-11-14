import type { AccessPeriod } from "../access";

const input =
  "rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900";

/** Amount + unit inputs (named "amount" and "unit") for an access period. */
export function PeriodFields({ defaultValue, label }: { defaultValue: AccessPeriod; label: string }) {
  return (
    <>
      <input
        name="amount"
        type="number"
        required
        min={1}
        max={365}
        step={1}
        defaultValue={defaultValue.amount}
        aria-label={`${label} amount`}
        className={`${input} w-20`}
      />
      <select name="unit" defaultValue={defaultValue.unit} aria-label={`${label} unit`} className={input}>
        <option value="DAY">days</option>
        <option value="WEEK">weeks</option>
        <option value="MONTH">months</option>
      </select>
    </>
  );
}

const UNIT_LABELS = { DAY: "day", WEEK: "week", MONTH: "month" } as const;

export function formatPeriod({ amount, unit }: AccessPeriod) {
  return `${amount} ${UNIT_LABELS[unit]}${amount === 1 ? "" : "s"}`;
}
