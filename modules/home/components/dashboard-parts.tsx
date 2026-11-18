import Link from "next/link";
import type { ReactNode } from "react";
import { buttonLink, cardSm, eyebrow, h1, h2, kpi } from "@/modules/ui/classes";

/** Date and greeting at the top of every dashboard. */
export function DashboardHeader({ name, now }: { name: string; now: Date }) {
  return (
    <header className="flex flex-col gap-1">
      <p className={eyebrow}>{now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>
      <h1 className={h1}>Hi, {name.split(/\s+/)[0]}</h1>
    </header>
  );
}

export function Kpi({ label, value, hint, href }: { label: string; value: ReactNode; hint: string; href?: string }) {
  const body = (
    <>
      <span className="text-sm font-medium text-secondary">{label}</span>
      <span className={kpi}>{value}</span>
      <span className="text-xs text-tertiary">{hint}</span>
    </>
  );
  return href ? (
    <Link href={href} className={`${cardSm} gap-2 hover:border-line-strong hover:bg-surface-muted`}>
      {body}
    </Link>
  ) : (
    <div className={`${cardSm} gap-2`}>{body}</div>
  );
}

export function KpiRow({ children }: { children: ReactNode }) {
  return (
    <section aria-label="Summary" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {children}
    </section>
  );
}

export function PanelHeader({ title, href, linkLabel }: { title: string; href?: string; linkLabel?: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h2 className={h2}>{title}</h2>
      {href && (
        <Link href={href} className={buttonLink}>
          {linkLabel}
        </Link>
      )}
    </div>
  );
}

export const panelRow = "flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0";
