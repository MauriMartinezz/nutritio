// What clients see about a nutritionist before asking to work together.

import type { Locale } from "@/lib/i18n/negotiate";
import { hasActiveAccess, type AccessUnit } from "./access";
import { coachingLabels } from "./messages";

type AcceptedLink = { accessUntil: Date | null; autoRenew: boolean; accessAmount: number; accessUnit: AccessUnit };

/** Accepted links whose access is still in force (auto-renew included). */
export function countActiveClients(links: AcceptedLink[], now: Date): number {
  return links.filter((link) => hasActiveAccess({ ...link, amount: link.accessAmount, unit: link.accessUnit }, now))
    .length;
}

export function activeClientsLabel(count: number, locale: Locale = "en"): string {
  const t = coachingLabels[locale];
  return count === 0 ? t.noActiveClients : t.activeClients(count);
}
