"use client";

import { useState, useSyncExternalStore } from "react";
import { useFormStatus } from "react-dom";
import { buttonSecondary, input } from "@/modules/ui/classes";
import type { AccessPeriod } from "../access";
import { CUSTOM_PRESET, PERIOD_PRESETS } from "../roster";
import { PeriodFields } from "./period-fields";

const noopSubscribe = () => () => {};

type Props = {
  action: (formData: FormData) => void | Promise<void>;
  /** Placeholder shown in the select, e.g. "Renew…". */
  placeholder: string;
  /** Submit label for custom periods, e.g. "Renew". */
  submitLabel: string;
  /** Accessible name, e.g. "Renew access for Ana". */
  label: string;
  customDefault: AccessPeriod;
};

/**
 * A select that acts as a button: choosing a preset submits right away and
 * "Custom…" reveals amount + unit fields. Without JavaScript it is a plain
 * form (preset select, custom fields and a submit button).
 */
export function QuickPeriodForm({ action, placeholder, submitLabel, label, customDefault }: Props) {
  const enhanced = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const [choice, setChoice] = useState("");
  const showCustom = !enhanced || choice === CUSTOM_PRESET;

  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <PresetSelect
        key={String(enhanced)}
        enhanced={enhanced}
        choice={choice}
        placeholder={placeholder}
        label={label}
        onChoose={(value, form) => {
          setChoice(value);
          if (value !== CUSTOM_PRESET) {
            form.requestSubmit();
            setChoice("");
          }
        }}
      />
      {showCustom && (
        <>
          <PeriodFields defaultValue={customDefault} label={label} />
          <SubmitButton label={submitLabel} />
        </>
      )}
    </form>
  );
}

type PresetSelectProps = {
  enhanced: boolean;
  choice: string;
  placeholder: string;
  label: string;
  onChoose: (value: string, form: HTMLFormElement) => void;
};

function PresetSelect({ enhanced, choice, placeholder, label, onChoose }: PresetSelectProps) {
  const { pending } = useFormStatus();
  const options = PERIOD_PRESETS.map((preset) => (
    <option key={preset.value} value={preset.value}>
      {preset.label}
    </option>
  ));
  const custom = <option value={CUSTOM_PRESET}>Custom…</option>;

  if (!enhanced) {
    return (
      <select name="preset" defaultValue={PERIOD_PRESETS[0].value} aria-label={label} className={input}>
        {options}
        {custom}
      </select>
    );
  }
  return (
    <select
      name="preset"
      value={choice}
      disabled={pending}
      aria-label={label}
      onChange={(event) => onChoose(event.target.value, event.target.form!)}
      className={`${input} font-semibold`}
    >
      <option value="" disabled>
        {pending ? "Saving…" : placeholder}
      </option>
      {options}
      {custom}
    </select>
  );
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button disabled={pending} className={buttonSecondary}>
      {label}
    </button>
  );
}
