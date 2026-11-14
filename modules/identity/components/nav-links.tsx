"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export type NavItem = { href: string; label: string; badge?: ReactNode };

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

/** Main navigation links; the current section is marked with aria-current. */
export function NavLinks({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  return (
    <ul className="flex gap-1 overflow-x-auto md:flex-col md:overflow-visible">
      {items.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <li key={item.href} className="shrink-0">
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-11 items-center gap-2 whitespace-nowrap rounded-control px-3.5 text-[15px] ${
                active ? "bg-surface-active font-semibold text-ink" : "font-medium text-tertiary hover:bg-surface-muted hover:text-ink"
              }`}
            >
              {item.label}
              {item.badge}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
