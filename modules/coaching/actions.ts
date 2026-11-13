"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/modules/identity/dal";
import {
  LinkRuleError,
  decideLinkRequest,
  respondToLinkRequest,
  type LinkResponse,
} from "./links";

/** A client asks to work with an approved nutritionist. */
export async function requestNutritionist(nutritionistId: string) {
  const client = await requireRole("CLIENT");

  const nutritionist = await prisma.user.findUnique({
    where: { id: nutritionistId },
    select: { role: true, nutritionistStatus: true },
  });
  if (!nutritionist) throw new LinkRuleError("This nutritionist is not available");

  const pair = { nutritionistId, clientId: client.id };
  const existing = await prisma.nutritionistClient.findUnique({
    where: { nutritionistId_clientId: pair },
    select: { status: true },
  });

  if (decideLinkRequest(nutritionist, existing) === "CREATE") {
    try {
      await prisma.nutritionistClient.create({ data: pair });
    } catch (error) {
      // Unique (nutritionist, client): a concurrent request already created it.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new LinkRuleError("Request already sent");
      }
      throw error;
    }
  } else {
    const { count } = await prisma.nutritionistClient.updateMany({
      where: { ...pair, status: "REJECTED" },
      data: { status: "PENDING", requestedAt: new Date(), respondedAt: null },
    });
    if (count === 0) throw new LinkRuleError("Request already sent");
  }

  revalidatePath("/nutritionists");
}

async function respond(linkId: string, response: LinkResponse) {
  const nutritionist = await requireRole("NUTRITIONIST");

  // Scoped to the signed-in nutritionist: nobody can answer someone else's request.
  const link = await prisma.nutritionistClient.findFirst({
    where: { id: linkId, nutritionistId: nutritionist.id },
    select: { status: true },
  });
  if (!link) throw new LinkRuleError("Request not found");

  const status = respondToLinkRequest(link, response);
  const { count } = await prisma.nutritionistClient.updateMany({
    where: { id: linkId, nutritionistId: nutritionist.id, status: "PENDING" },
    data: { status, respondedAt: new Date() },
  });
  if (count === 0) throw new LinkRuleError("Only pending requests can be answered");

  revalidatePath("/clients");
}

export async function acceptClientRequest(linkId: string) {
  await respond(linkId, "ACCEPT");
}

export async function rejectClientRequest(linkId: string) {
  await respond(linkId, "REJECT");
}
