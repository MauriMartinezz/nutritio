import Link from "next/link";
import { getMessages } from "@/lib/i18n/server";
import { PendingActions } from "@/modules/meetings/components/pending-actions-badge";
import { getCurrentUser, type CurrentUser } from "../dal";
import { navMessages, roleMessages } from "../nav-messages";
import { NavLinks, ProfileLink, type NavItem } from "./nav-links";

type NavText = (typeof navMessages)["en"];

function navItems(user: CurrentUser, t: NavText): NavItem[] {
  const items: NavItem[] = [{ href: "/", label: t.home }];
  if (user.role === "CLIENT") {
    items.push(
      { href: "/my-plans", label: t.myPlans },
      { href: "/check-ins", label: t.checkIns },
      { href: "/activities", label: t.activities },
      { href: "/meetings", label: t.meetings },
      { href: "/nutritionists", label: t.findNutritionist },
    );
  }
  if (user.nutritionistStatus === "APPROVED") {
    items.push(
      { href: "/clients", label: t.myClients, badge: <PendingActions /> },
      { href: "/plans", label: t.planTemplates },
    );
  }
  if (user.role === "ADMIN") {
    items.push({ href: "/admin", label: t.nutritionists });
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

/**
 * Role-based sidebar, only for signed-in people: the landing and the sign-in
 * pages have no app to navigate. Reads the session: render inside <Suspense>.
 */
export async function AppNav() {
  const user = await getCurrentUser();
  if (!user) return null;
  const t = await getMessages(navMessages);
  const roles = await getMessages(roleMessages);
  return (
    <nav
      aria-label={t.mainNav}
      className="relative flex flex-col gap-4 border-b border-line bg-surface px-4 py-4 md:sticky md:top-0 md:h-screen md:w-60 md:shrink-0 md:gap-8 md:border-r md:border-b-0 md:px-[18px] md:py-7"
    >
      <Brand />
      <NavLinks items={navItems(user, t)} />
      <ProfileLink name={user.name} initials={initials(user.name)} roleLabel={roles[user.role]} />
    </nav>
  );
}
