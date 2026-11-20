import Link from "next/link";
import type { ReactNode } from "react";
import { formatDateTime } from "@/lib/i18n/format";
import { getLocale, getMessages } from "@/lib/i18n/server";
import { buttonLink, cardSm, eyebrow, h1, h2, kpi } from "@/modules/ui/classes";
import { homeMessages } from "../messages";

/** Date and greeting at the top of every dashboard. */
export async function DashboardHeader({ name, now }: { name: string; now: Date }) {
  const [locale, t] = await Promise.all([getLocale(), getMessages(homeMessages)]);
  const today = formatDateTime(now, locale, {
    dateStyle: undefined,
    timeStyle: undefined,
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  return (
    <header className="flex flex-col gap-1">
      <p className={`${eyebrow} first-letter:uppercase`}>{today}</p>
      <h1 className={h1}>{t.hi(name.split(/\s+/)[0])}</h1>
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

export async function KpiRow({ children }: { children: ReactNode }) {
  const t = await getMessages(homeMessages);
  return (
    <section aria-label={t.summary} className="grid grid-cols-2 gap-3 lg:grid-cols-4">
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
