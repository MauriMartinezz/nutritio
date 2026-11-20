import type { Locale } from "@/lib/i18n/negotiate";
import { uiMessages } from "../messages";

/** Radio rendered as one segment of a button group (the input stays focusable). */
const segment =
  "flex min-h-11 flex-1 cursor-pointer items-center justify-center px-3 text-sm font-medium text-secondary has-[:checked]:bg-accent has-[:checked]:text-on-accent has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent hover:text-ink";
const group = "flex divide-x divide-line overflow-hidden rounded-control border border-line-strong bg-surface";

/** A radio group shown as a segmented control. Plain markup: works on server and client, and without JS. */
export function Segmented({
  name,
  options,
  required,
  defaultValue,
}: {
  name: string;
  options: { value: string; label: string }[];
  required?: boolean;
  defaultValue?: string | null;
}) {
  return (
    <div className={group}>
      {options.map((option) => (
        <label key={option.value} className={segment}>
          <input
            type="radio"
            name={name}
            value={option.value}
            required={required}
            defaultChecked={defaultValue === option.value}
            className="sr-only"
          />
          {option.label}
        </label>
      ))}
    </div>
  );
}

/** English Yes/No options (kept for existing callers; prefer yesNo(locale)). */
export const YES_NO = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

/** Yes/No options in the given language. */
export function yesNo(locale: Locale) {
  const t = uiMessages[locale];
  return [
    { value: "yes", label: t.yes },
    { value: "no", label: t.no },
  ];
}
