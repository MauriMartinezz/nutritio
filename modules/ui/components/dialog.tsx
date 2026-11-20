"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useMessages } from "@/lib/i18n/client";
import { eyebrow as eyebrowClass, h2 } from "@/modules/ui/classes";
import { uiMessages } from "../messages";
import { CloseOnEscape } from "./close-on-escape";

/**
 * Centered modal driven by the URL: closing is a link, so it works without
 * JavaScript; Escape closes it too. Bottom sheet on small screens.
 */
export function Dialog({
  title,
  eyebrow,
  closeHref,
  children,
}: {
  title: ReactNode;
  eyebrow?: string;
  closeHref: string;
  children: ReactNode;
}) {
  const t = useMessages(uiMessages);
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center sm:items-center sm:p-4">
      <CloseOnEscape href={closeHref} />
      <Link href={closeHref} scroll={false} aria-label={t.close} className="absolute inset-0 bg-black/40" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        className="relative flex max-h-[90dvh] w-full max-w-md flex-col overflow-y-auto rounded-t-card border border-line bg-surface sm:rounded-card"
      >
        <header className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div className="flex min-w-0 flex-col gap-1">
            {eyebrow && <p className={eyebrowClass}>{eyebrow}</p>}
            <h2 id="dialog-title" className={h2}>
              {title}
            </h2>
          </div>
          <Link
            href={closeHref}
            scroll={false}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-control text-xl text-secondary hover:bg-surface-muted hover:text-ink"
          >
            <span aria-hidden="true">×</span>
            <span className="sr-only">{t.close}</span>
          </Link>
        </header>
        <div className="flex flex-col gap-5 px-5 py-5">{children}</div>
      </div>
    </div>
  );
}
