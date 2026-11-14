import Link from "next/link";
import { PendingActions } from "@/modules/meetings/components/pending-actions-badge";
import { getCurrentUser, type CurrentUser } from "../dal";
import { NavLinks, ProfileLink, type NavItem } from "./nav-links";

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
    );
  }
  if (user.nutritionistStatus === "APPROVED") {
    items.push(
      { href: "/clients", label: "My clients", badge: <PendingActions /> },
      { href: "/plans", label: "Plan templates" },
    );
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
        <ProfileLink
          name={user.name}
          initials={initials(user.name)}
          roleLabel={ROLE_LABELS[user.role]}
        />
      )}
    </>
  );
}
