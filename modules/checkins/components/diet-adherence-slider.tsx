"use client";

import { useState } from "react";
import { formatNumber } from "@/lib/i18n/format";
import { useLocale } from "@/lib/i18n/client";
import { checkInMessages } from "../messages";
import { CHECK_IN_LIMITS } from "../rules";

/** Slider (0–100 %, step 5) for how much of the diet the client could follow. */
export function DietAdherenceSlider({ defaultValue = 50 }: { defaultValue?: number }) {
  const [value, setValue] = useState(defaultValue);
  const locale = useLocale();
  const percent = (n: number) => `${formatNumber(n, locale)}%`;

  return (
    <label className="flex flex-col gap-2 text-sm font-medium">
      <span className="flex items-baseline justify-between gap-3">
        {checkInMessages[locale].dietQuestion}
        <output htmlFor="dietAdherence" className="font-mono text-base font-semibold tabular-nums text-accent">
          {percent(value)}
        </output>
      </span>
      <input
        id="dietAdherence"
        name="dietAdherence"
        type="range"
        min={0}
        max={CHECK_IN_LIMITS.maxDietAdherence}
        step={CHECK_IN_LIMITS.dietAdherenceStep}
        value={value}
        onChange={(event) => setValue(Number(event.target.value))}
        aria-valuetext={percent(value)}
        className="h-11 w-full cursor-pointer accent-[var(--accent)]"
      />
      <span className="flex justify-between font-mono text-xs font-normal text-secondary">
        <span>0%</span>
        <span>100%</span>
      </span>
    </label>
  );
}
