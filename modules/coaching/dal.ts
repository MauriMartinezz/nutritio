import "server-only";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/modules/identity/dal";
import { canAccessClient } from "./links";

/**
 * Gate for every read of a client's data by a nutritionist. Responds 404
 * (not 403) so it does not reveal whether the client exists.
 */
export async function requireClientAccess(clientId: string) {
  const nutritionist = await requireRole("NUTRITIONIST");

  const link = await prisma.nutritionistClient.findUnique({
    where: { nutritionistId_clientId: { nutritionistId: nutritionist.id, clientId } },
    select: { status: true, respondedAt: true },
  });
  if (!canAccessClient(link)) notFound();

  return { nutritionist, workingSince: link?.respondedAt ?? null };
}

export async function getClientProfile(clientId: string) {
  const { workingSince } = await requireClientAccess(clientId);

  const client = await prisma.user.findUnique({
    where: { id: clientId },
    select: { id: true, name: true, email: true },
  });
  if (!client) notFound();

  return { ...client, workingSince };
}
