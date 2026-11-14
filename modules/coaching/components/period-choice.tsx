import type { AccessPeriod } from "../access";
import { CUSTOM_PRESET, PERIOD_PRESETS } from "../roster";
import { PeriodFields } from "./period-fields";

const row =
  "flex min-h-12 cursor-pointer items-center gap-3 rounded-control border border-line-strong px-3 text-sm has-[:checked]:border-accent has-[:checked]:bg-accent-tint has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent";

/**
 * Period presets as radios, each with the end date it would give, plus a
 * custom amount + unit (shown when chosen; CSS only, works without JS).
 */
export function PeriodChoice({
  endDates,
  current,
}: {
  /** End date per preset value, computed by the caller (renew extends, accept starts today). */
  endDates: Record<string, Date>;
  current: AccessPeriod;
}) {
  const matching = PERIOD_PRESETS.find(
    (preset) => preset.period.amount === current.amount && preset.period.unit === current.unit,
  );

  return (
    <fieldset className="group flex flex-col gap-2">
      <legend className="mb-2 text-sm font-medium">Period</legend>
      {PERIOD_PRESETS.map((preset) => (
        <label key={preset.value} className={row}>
          <input
            type="radio"
            name="preset"
            value={preset.value}
            required
            defaultChecked={preset.value === matching?.value}
            className="size-4 accent-accent"
          />
          <span className="flex-1 font-medium">{preset.label}</span>
          <span className="font-mono text-xs text-secondary tabular-nums">
            until {endDates[preset.value]?.toLocaleDateString()}
          </span>
        </label>
      ))}
      <label className={row}>
        <input
          type="radio"
          name="preset"
          value={CUSTOM_PRESET}
          required
          defaultChecked={!matching}
          className="size-4 accent-accent"
        />
        <span className="flex-1 font-medium">Custom</span>
      </label>
      <div className="hidden flex-wrap items-center gap-2 pl-7 group-has-[input[value=custom]:checked]:flex">
        <PeriodFields defaultValue={current} label="Custom period" />
      </div>
    </fieldset>
  );
}
