"use client";

import { useState } from "react";
import { CHECK_IN_LIMITS } from "../rules";

/** Slider (0–100 %, step 5) for how much of the diet the client could follow. */
export function DietAdherenceSlider({ defaultValue = 50 }: { defaultValue?: number }) {
  const [value, setValue] = useState(defaultValue);

  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="flex items-baseline justify-between">
        How much of the diet could you follow?
        <output htmlFor="dietAdherence" className="font-medium tabular-nums">
          {value}%
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
        aria-valuetext={`${value}%`}
        className="w-full accent-emerald-600"
      />
      <span className="flex justify-between text-xs text-zinc-500">
        <span>0%</span>
        <span>100%</span>
      </span>
    </label>
  );
}
