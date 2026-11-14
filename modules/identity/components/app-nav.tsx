import Link from "next/link";
import { PendingActions } from "@/modules/meetings/components/pending-actions-badge";
import { getCurrentUser, type CurrentUser } from "../dal";
import { NavLinks, type NavItem } from "./nav-links";
import { SignOutButton } from "./sign-out-button";

const ROLE_LABELS = {
  ADMIN: "Administrator",
  NUTRITIONIST: "Nutritionist",
  CLIENT: "Client",
} as const;

function navItems(user: CurrentUser | null): NavItem[] {
  if (!user) {
    return [
      { href: "/", label: "Home" },
      { href: "/sign-in", label: "Sign in" },
      { href: "/sign-up", label: "Create an account" },
    ];
  }
  const items: NavItem[] = [{ href: "/", label: "Home" }];
  if (user.role === "CLIENT") {
    items.push(
      { href: "/my-plans", label: "My meal plans" },
      { href: "/check-ins", label: "Check-ins" },
      { href: "/activities", label: "Activities" },
      { href: "/meetings", label: "Meetings" },
      { href: "/nutritionists", label: "Find a nutritionist" },
      { href: "/preferences", label: "Preferences" },
    );
  }
  if (user.nutritionistStatus === "APPROVED") {
    items.push(
      { href: "/clients", label: "My clients", badge: <PendingActions /> },
      { href: "/plans", label: "Plan templates" },
    );
  }
  if (user.role === "NUTRITIONIST" && (user.nutritionistStatus === "APPROVED" || user.nutritionistStatus === "PENDING")) {
    items.push({ href: "/profile", label: "Public profile" });
  }
  if (user.role === "ADMIN") {
    items.push({ href: "/admin", label: "Nutritionists" });
  }
  return items;
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
}

/** Brand mark shown at the top of the navigation. */
export function Brand() {
  return (
    <Link href="/" className="flex items-center gap-2.5 px-2">
      <span className="flex size-9 items-center justify-center rounded-control bg-ink font-mono text-xl font-semibold text-bg">
        N
      </span>
      <span className="text-[22px] font-bold tracking-[-0.03em]">nutritio</span>
    </Link>
  );
}

/** Role-based navigation. Reads the session: render inside <Suspense>. */
export async function AppNav() {
  const user = await getCurrentUser();
  return (
    <>
      <NavLinks items={navItems(user)} />
      {user && (
        <div className="hidden flex-col gap-3 rounded-card bg-surface-muted p-3.5 md:mt-auto md:flex">
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-active font-bold"
            >
              {initials(user.name)}
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-semibold">{user.name}</span>
              <span className="text-xs text-tertiary">{ROLE_LABELS[user.role]}</span>
            </span>
          </div>
          <SignOutButton className="w-full" />
        </div>
      )}
      {user && (
        <div className="absolute top-3.5 right-4 md:hidden">
          <SignOutButton />
        </div>
      )}
    </>
  );
}
