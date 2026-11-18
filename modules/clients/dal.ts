import "server-only";
import { prisma } from "@/lib/prisma";
import { requireClientAccess } from "@/modules/coaching/dal";
import { requireRole } from "@/modules/identity/dal";
import type { ClientPreferences } from "./preferences";

const PREFERENCES_SELECT = {
  lowCarb: true,
  vegan: true,
  vegetarian: true,
  glutenFree: true,
  prefersMealPrep: true,
  diabetic: true,
  celiac: true,
  hypertension: true,
  cookingStyle: true,
  intolerances: true,
  otherConditions: true,
  notes: true,
  sex: true,
} as const;

/** The signed-in client's own preferences; null until first saved. */
export async function getOwnPreferences(): Promise<ClientPreferences | null> {
  const client = await requireRole("CLIENT");
  return prisma.clientPreferences.findUnique({
    where: { userId: client.id },
    select: PREFERENCES_SELECT,
  });
}

/**
 * A client's preferences and medical info, for a nutritionist. Medical data:
 * only through the accepted-link gate (404 otherwise).
 */
export async function getClientPreferencesForNutritionist(
  clientId: string,
): Promise<ClientPreferences | null> {
  await requireClientAccess(clientId);
  return prisma.clientPreferences.findUnique({
    where: { userId: clientId },
    select: PREFERENCES_SELECT,
  });
}
