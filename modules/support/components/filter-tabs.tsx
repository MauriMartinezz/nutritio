import Link from "next/link";

/** Pill links that filter a list through the URL (e.g. ?status=OPEN). */
export function FilterTabs({ current, base, labels, param = "status" }: { current: string; base: string; labels: [string, string][]; param?: string }) {
  return (
    <nav className="flex flex-wrap gap-2 text-sm font-semibold">
      {labels.map(([value, label]) => (
        <Link
          key={value}
          href={{ pathname: base, query: { [param]: value } }}
          aria-current={current === value ? "page" : undefined}
          className={`inline-flex min-h-11 items-center rounded-full px-4 ${
            current === value ? "bg-ink text-bg" : "border border-line-strong bg-surface text-ink hover:bg-surface-muted"
          }`}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
