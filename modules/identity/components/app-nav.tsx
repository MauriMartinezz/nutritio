import Link from "next/link";
import type { ReactNode } from "react";
import { prisma } from "@/lib/prisma";
import { getMessages } from "@/lib/i18n/server";
import { PendingActions } from "@/modules/meetings/components/pending-actions-badge";
import { OpenRequestsBadge } from "@/modules/support/components/open-requests-badge";
import { getCurrentUser, type CurrentUser } from "../dal";
import { navSections, type NavSection } from "../nav";
import { navMessages, roleMessages } from "../nav-messages";
import { NavLinks, ProfileLink, type NavItem } from "./nav-links";

type NavText = (typeof navMessages)["en"];

const SECTIONS: Record<NavSection, { href: string; label: (t: NavText) => string; badge?: ReactNode }> = {
  home: { href: "/", label: (t) => t.home },
  myPlans: { href: "/my-plans", label: (t) => t.myPlans },
  checkIns: { href: "/check-ins", label: (t) => t.checkIns },
  activities: { href: "/activities", label: (t) => t.activities },
  meetings: { href: "/meetings", label: (t) => t.meetings },
  findNutritionist: { href: "/nutritionists", label: (t) => t.findNutritionist },
  myClients: { href: "/clients", label: (t) => t.myClients, badge: <PendingActions /> },
  planTemplates: { href: "/plans", label: (t) => t.planTemplates },
  nutritionists: { href: "/admin", label: (t) => t.nutritionists },
  users: { href: "/admin/users", label: (t) => t.users },
  requests: { href: "/admin/requests", label: (t) => t.requests, badge: <OpenRequestsBadge /> },
  contact: { href: "/contact", label: (t) => t.contact },
};

async function navItems(user: CurrentUser, t: NavText): Promise<NavItem[]> {
  const hadNutritionist =
    user.role === "CLIENT" &&
    (await prisma.nutritionistClient.count({ where: { clientId: user.id, status: "ACCEPTED" } })) > 0;
  return navSections(user, { hadNutritionist }).map((section) => {
    const { href, label, badge } = SECTIONS[section];
    return { href, label: label(t), badge };
  });
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
      <NavLinks items={await navItems(user, t)} />
      <ProfileLink name={user.name} initials={initials(user.name)} roleLabel={roles[user.role]} />
    </nav>
  );
}
