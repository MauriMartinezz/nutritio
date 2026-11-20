// Which sections each person sees in the sidebar. Pure: unit tested.
import type { NutritionistStatus, Role } from "./roles";

export type NavSection =
  | "home"
  | "myPlans"
  | "checkIns"
  | "activities"
  | "meetings"
  | "findNutritionist"
  | "myClients"
  | "planTemplates"
  | "nutritionists"
  | "users"
  | "requests"
  | "contact";

/**
 * Plans, check-ins and meetings only exist with a nutritionist, so a client
 * who never had one (no accepted link, even an expired one) doesn't see them.
 */
export function navSections(
  user: { role: Role; nutritionistStatus: NutritionistStatus | null },
  { hadNutritionist }: { hadNutritionist: boolean },
): NavSection[] {
  const sections: NavSection[] = ["home"];
  if (user.role === "CLIENT") {
    if (hadNutritionist) sections.push("myPlans", "checkIns", "activities", "meetings");
    else sections.push("activities");
    sections.push("findNutritionist");
  }
  if (user.nutritionistStatus === "APPROVED") sections.push("myClients", "planTemplates");
  if (user.role === "ADMIN") sections.push("nutritionists", "users", "requests");
  else sections.push("contact");
  return sections;
}
