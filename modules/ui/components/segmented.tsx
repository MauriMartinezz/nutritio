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

export const YES_NO = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];
