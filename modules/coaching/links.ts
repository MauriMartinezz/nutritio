// Rules for the client ↔ nutritionist working relationship.
// A client can work with several nutritionists at once (one link per pair).
import type { Locale } from "@/lib/i18n/negotiate";
import type { NutritionistStatus, Role } from "@/modules/identity/roles";
import { coachingErrors } from "./messages";

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
  locale: Locale = "en",
): "CREATE" | "REOPEN" {
  const t = coachingErrors[locale];
  if (nutritionist.role !== "NUTRITIONIST" || nutritionist.nutritionistStatus !== "APPROVED") {
    throw new LinkRuleError(t.nutritionistUnavailable);
  }
  if (!existing) return "CREATE";
  if (existing.status === "PENDING") throw new LinkRuleError(t.requestAlreadySent);
  if (existing.status === "ACCEPTED") throw new LinkRuleError(t.alreadyWorking);
  return "REOPEN";
}

/** The nutritionist answers a pending request. Only approved nutritionists may answer. */
export function respondToLinkRequest(
  nutritionistStatus: NutritionistStatus | null,
  link: { status: LinkStatus },
  response: LinkResponse,
  locale: Locale = "en",
): Exclude<LinkStatus, "PENDING"> {
  const t = coachingErrors[locale];
  if (nutritionistStatus !== "APPROVED") {
    throw new LinkRuleError(t.verifyToAnswer);
  }
  if (link.status !== "PENDING") throw new LinkRuleError(t.onlyPending);
  return response === "ACCEPT" ? "ACCEPTED" : "REJECTED";
}

/**
 * A nutritionist may read a client's data only while approved and while their link is accepted.
 * Revoking a nutritionist keeps the link, so re-approval restores access.
 */
export function canAccessClient(
  nutritionistStatus: NutritionistStatus | null,
  link: { status: LinkStatus } | null,
): boolean {
  return nutritionistStatus === "APPROVED" && link?.status === "ACCEPTED";
}
