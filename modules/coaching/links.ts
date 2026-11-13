// Rules for the client ↔ nutritionist working relationship.
// A client can work with several nutritionists at once (one link per pair).
import type { NutritionistStatus, Role } from "@/modules/identity/roles";

export const LINK_STATUSES = ["PENDING", "ACCEPTED", "REJECTED"] as const;
export type LinkStatus = (typeof LINK_STATUSES)[number];

export type LinkResponse = "ACCEPT" | "REJECT";

export class LinkRuleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LinkRuleError";
  }
}

/**
 * Decides what happens when a client asks to work with a nutritionist.
 * CREATE: no link yet. REOPEN: a rejected link goes back to PENDING.
 */
export function decideLinkRequest(
  nutritionist: { role: Role; nutritionistStatus: NutritionistStatus | null },
  existing: { status: LinkStatus } | null,
): "CREATE" | "REOPEN" {
  if (nutritionist.role !== "NUTRITIONIST" || nutritionist.nutritionistStatus !== "APPROVED") {
    throw new LinkRuleError("This nutritionist is not available");
  }
  if (!existing) return "CREATE";
  if (existing.status === "PENDING") throw new LinkRuleError("Request already sent");
  if (existing.status === "ACCEPTED") throw new LinkRuleError("You already work with this nutritionist");
  return "REOPEN";
}

/** The nutritionist answers a pending request. */
export function respondToLinkRequest(
  link: { status: LinkStatus },
  response: LinkResponse,
): Exclude<LinkStatus, "PENDING"> {
  if (link.status !== "PENDING") throw new LinkRuleError("Only pending requests can be answered");
  return response === "ACCEPT" ? "ACCEPTED" : "REJECTED";
}

/** A nutritionist may read a client's data only while their link is accepted. */
export function canAccessClient(link: { status: LinkStatus } | null): boolean {
  return link?.status === "ACCEPTED";
}
