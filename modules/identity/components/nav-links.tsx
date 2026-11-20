"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useMessages } from "@/lib/i18n/client";
import { LOCALES } from "@/lib/i18n/negotiate";
import { navMessages } from "../nav-messages";

export type NavItem = { href: string; label: string; badge?: ReactNode };

// The URL never shows the locale, but a rewritten path may carry it: ignore it.
const LOCALE_PREFIX = new RegExp(`^/(${LOCALES.join("|")})(?=/|$)`);

function matches(rawPathname: string, href: string) {
  const pathname = rawPathname.replace(LOCALE_PREFIX, "") || "/";
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}


/** The most specific link wins: on /admin/users only "Users" is current, not "/admin" too. */
function activeHref(pathname: string, items: NavItem[]) {
  return items
    .filter((item) => matches(pathname, item.href))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;
}

/** Main navigation links; the current section is marked with aria-current. */
export function NavLinks({ items }: { items: NavItem[] }) {
  const current = activeHref(usePathname(), items);
  return (
    <ul className="flex gap-1 overflow-x-auto md:flex-col md:overflow-visible">
      {items.map((item) => {
        const active = item.href === current;
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
  const t = useMessages(navMessages);
  const active = matches(usePathname(), "/profile");
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
          <span className="text-xs text-tertiary">{roleLabel} · {t.profile}</span>
        </span>
      </Link>
      <Link
        href="/profile"
        aria-current={active ? "page" : undefined}
        aria-label={t.profileOf(name)}
        className="absolute top-3 right-4 flex min-h-11 items-center md:hidden"
      >
        {avatar}
      </Link>
    </>
  );
}
