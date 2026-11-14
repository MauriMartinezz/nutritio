// What clients see about a nutritionist before asking to work together.

import { hasActiveAccess, type AccessUnit } from "./access";

type AcceptedLink = { accessUntil: Date | null; autoRenew: boolean; accessAmount: number; accessUnit: AccessUnit };

/** Accepted links whose access is still in force (auto-renew included). */
export function countActiveClients(links: AcceptedLink[], now: Date): number {
  return links.filter((link) => hasActiveAccess({ ...link, amount: link.accessAmount, unit: link.accessUnit }, now))
    .length;
}

export function activeClientsLabel(count: number): string {
  if (count === 0) return "No active clients yet";
  return `${count} active ${count === 1 ? "client" : "clients"}`;
}
