"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/modules/identity/dal";
import { addPeriod, effectiveAccessUntil, parsePeriod, renewAccess, type AccessPeriod } from "./access";
import type { FlashKey } from "@/modules/ui/flash";
import { setFlash } from "@/modules/ui/set-flash";
import { parsePeriodChoice, parseRosterFilter, rosterHref } from "./roster";
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
  revalidatePath(`/nutritionists/${nutritionistId}`);
}

async function respond(linkId: string, response: LinkResponse, period?: AccessPeriod) {
  const nutritionist = await requireRole("NUTRITIONIST");

  // Scoped to the signed-in nutritionist: nobody can answer someone else's request.
  const link = await prisma.nutritionistClient.findFirst({
    where: { id: linkId, nutritionistId: nutritionist.id },
    select: { status: true },
  });
  if (!link) throw new LinkRuleError("Request not found");

  const status = respondToLinkRequest(nutritionist.nutritionistStatus, link, response);
  const now = new Date();
  const { count } = await prisma.nutritionistClient.updateMany({
    where: { id: linkId, nutritionistId: nutritionist.id, status: "PENDING" },
    data: {
      status,
      respondedAt: now,
      // Accepting grants access for the chosen period, which becomes the renewal default.
      ...(status === "ACCEPTED" &&
        period && {
          accessAmount: period.amount,
          accessUnit: period.unit,
          accessUntil: addPeriod(now, period),
          autoRenew: false,
        }),
    },
  });
  if (count === 0) throw new LinkRuleError("Only pending requests can be answered");

  revalidatePath("/clients");
  revalidatePath("/");
}

/** Accepts a request, granting access for the period in the form (a preset, or amount + unit). */
export async function acceptClientRequest(linkId: string, formData: FormData) {
  await respond(linkId, "ACCEPT", parsePeriodChoice(Object.fromEntries(formData)));
  await backToRoster(formData, "client-accepted");
}

export async function rejectClientRequest(linkId: string, formData: FormData) {
  await respond(linkId, "REJECT");
  await backToRoster(formData, "client-declined");
}

/** Closes the dialog: back to the clients table (same filter) with a toast. */
async function backToRoster(formData: FormData, flash: FlashKey): Promise<never> {
  await setFlash(flash);
  // Only a known filter value: the return URL is never taken from the browser.
  redirect(rosterHref(parseRosterFilter(formData.get("filter"))));
}

/** An accepted link of the signed-in approved nutritionist, or an error. */
async function requireOwnAcceptedLink(linkId: string) {
  const nutritionist = await requireRole("NUTRITIONIST");
  if (nutritionist.nutritionistStatus !== "APPROVED") {
    throw new LinkRuleError("Your profile must be verified to manage access");
  }
  const link = await prisma.nutritionistClient.findFirst({
    where: { id: linkId, nutritionistId: nutritionist.id, status: "ACCEPTED" },
    select: { id: true, accessUntil: true, autoRenew: true, accessAmount: true, accessUnit: true },
  });
  if (!link) throw new LinkRuleError("Client not found");
  return { ...link, amount: link.accessAmount, unit: link.accessUnit };
}

/** Quick renew: extends access by the chosen period (a preset, or amount + unit). */
export async function renewClientAccess(linkId: string, formData: FormData) {
  const link = await requireOwnAcceptedLink(linkId);
  const period = parsePeriodChoice(Object.fromEntries(formData));
  await prisma.nutritionistClient.update({
    where: { id: link.id },
    data: { accessUntil: renewAccess(link, period, new Date()) },
  });
  revalidatePath("/clients", "layout");
  revalidatePath("/");
  await backToRoster(formData, "access-renewed");
}

/** Turns automatic renewal on or off and sets its period (also the renewal default). */
export async function setAutoRenew(linkId: string, formData: FormData) {
  const link = await requireOwnAcceptedLink(linkId);
  const period = parsePeriod(formData.get("amount"), formData.get("unit"));
  const autoRenew = formData.get("autoRenew") === "on";
  await prisma.nutritionistClient.update({
    where: { id: link.id },
    data: {
      // Keep any period already earned by auto-renewal before changing the settings.
      accessUntil: effectiveAccessUntil(link, new Date()),
      autoRenew,
      accessAmount: period.amount,
      accessUnit: period.unit,
    },
  });
  revalidatePath("/clients", "layout");
}
