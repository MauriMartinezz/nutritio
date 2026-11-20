import { getLocale } from "@/lib/i18n/server";
import type { AccessPeriod } from "../access";
import { formatDate } from "../dates";
import { coachingLabels, coachingMessages } from "../messages";
import { CUSTOM_PRESET, PERIOD_PRESETS } from "../roster";
import { PeriodFields } from "./period-fields";

const row =
  "flex min-h-12 cursor-pointer items-center gap-3 rounded-control border border-line-strong px-3 text-sm has-[:checked]:border-accent has-[:checked]:bg-accent-tint has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent";

/**
 * Period presets as radios, each with the end date it would give, plus a
 * custom amount + unit (shown when chosen; CSS only, works without JS).
 */
export async function PeriodChoice({
  endDates,
  current,
}: {
  /** End date per preset value, computed by the caller (renew extends, accept starts today). */
  endDates: Record<string, Date>;
  current: AccessPeriod;
}) {
  const locale = await getLocale();
  const t = coachingMessages[locale];
  const presets = coachingLabels[locale].presets;
  const matching = PERIOD_PRESETS.find(
    (preset) => preset.period.amount === current.amount && preset.period.unit === current.unit,
  );

  return (
    <fieldset className="group flex flex-col gap-2">
      <legend className="mb-2 text-sm font-medium">{t.period}</legend>
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
          <span className="flex-1 font-medium">{presets[preset.value]}</span>
          <span className="font-mono text-xs text-secondary tabular-nums">
            {endDates[preset.value] && t.until(formatDate(endDates[preset.value], locale))}
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
        <span className="flex-1 font-medium">{t.custom}</span>
      </label>
      <div className="hidden flex-wrap items-center gap-2 pl-7 group-has-[input[value=custom]:checked]:flex">
        <PeriodFields defaultValue={current} label={t.customPeriod} />
      </div>
    </fieldset>
  );
}
