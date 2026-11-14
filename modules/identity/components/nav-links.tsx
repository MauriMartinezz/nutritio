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

type ProfileLinkProps = { name: string; initials: string; roleLabel: string };

/**
 * The signed-in user's name opens the profile page: a card at the bottom of
 * the sidebar, and an avatar in the top bar on mobile.
 */
export function ProfileLink({ name, initials, roleLabel }: ProfileLinkProps) {
  const active = isActive(usePathname(), "/profile");
  const avatar = (
    <span
      aria-hidden="true"
      className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-active font-bold"
    >
      {initials}
    </span>
  );
  return (
    <>
      <Link
        href="/profile"
        aria-current={active ? "page" : undefined}
        className={`hidden items-center gap-3 rounded-card p-3.5 md:mt-auto md:flex ${
          active ? "bg-surface-active" : "bg-surface-muted hover:bg-surface-active"
        }`}
      >
        {avatar}
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-semibold">{name}</span>
          <span className="text-xs text-tertiary">{roleLabel} · Profile</span>
        </span>
      </Link>
      <Link
        href="/profile"
        aria-current={active ? "page" : undefined}
        aria-label={`Profile (${name})`}
        className="absolute top-3 right-4 flex min-h-11 items-center md:hidden"
      >
        {avatar}
      </Link>
    </>
  );
}
