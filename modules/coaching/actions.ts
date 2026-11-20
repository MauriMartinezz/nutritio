"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getActionLocale, getActionMessages } from "@/lib/i18n/server";
import { requireRole } from "@/modules/identity/dal";
import { addPeriod, effectiveAccessUntil, renewAccess, type AccessPeriod } from "./access";
import type { FlashKey } from "@/modules/ui/flash";
import { setFlash } from "@/modules/ui/set-flash";
import { coachingErrors } from "./messages";
import { parseAutoRenew, parsePeriodChoice, parseRosterFilter, renewReturnHref, rosterHref } from "./roster";
import {
  LinkRuleError,
  decideLinkRequest,
  respondToLinkRequest,
  type LinkResponse,
} from "./links";

/** A client asks to work with an approved nutritionist. */
export async function requestNutritionist(nutritionistId: string) {
  const client = await requireRole("CLIENT");
  const locale = await getActionLocale();
  const t = coachingErrors[locale];

  const nutritionist = await prisma.user.findUnique({
    where: { id: nutritionistId },
    select: { role: true, nutritionistStatus: true },
  });
  if (!nutritionist) throw new LinkRuleError(t.nutritionistUnavailable);

  const pair = { nutritionistId, clientId: client.id };
  const existing = await prisma.nutritionistClient.findUnique({
    where: { nutritionistId_clientId: pair },
    select: { status: true },
  });

  if (decideLinkRequest(nutritionist, existing, locale) === "CREATE") {
    try {
      await prisma.nutritionistClient.create({ data: pair });
    } catch (error) {
      // Unique (nutritionist, client): a concurrent request already created it.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new LinkRuleError(t.requestAlreadySent);
      }
      throw error;
    }
  } else {
    const { count } = await prisma.nutritionistClient.updateMany({
      where: { ...pair, status: "REJECTED" },
      data: { status: "PENDING", requestedAt: new Date(), respondedAt: null },
    });
    if (count === 0) throw new LinkRuleError(t.requestAlreadySent);
  }

  revalidatePath("/nutritionists");
  revalidatePath(`/nutritionists/${nutritionistId}`);
  await setFlash("nutritionist-requested");
}

async function respond(linkId: string, response: LinkResponse, period?: AccessPeriod) {
  const nutritionist = await requireRole("NUTRITIONIST");
  const locale = await getActionLocale();
  const t = coachingErrors[locale];

  // Scoped to the signed-in nutritionist: nobody can answer someone else's request.
  const link = await prisma.nutritionistClient.findFirst({
    where: { id: linkId, nutritionistId: nutritionist.id },
    select: { status: true },
  });
  if (!link) throw new LinkRuleError(t.requestNotFound);

  const status = respondToLinkRequest(nutritionist.nutritionistStatus, link, response, locale);
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
  if (count === 0) throw new LinkRuleError(t.onlyPending);

  revalidatePath("/clients");
  revalidatePath("/");
}

/** Accepts a request, granting access for the period in the form (a preset, or amount + unit). */
export async function acceptClientRequest(linkId: string, formData: FormData) {
  await respond(linkId, "ACCEPT", parsePeriodChoice(Object.fromEntries(formData), await getActionLocale()));
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
  const t = await getActionMessages(coachingErrors);
  if (nutritionist.nutritionistStatus !== "APPROVED") {
    throw new LinkRuleError(t.verifyToManage);
  }
  const link = await prisma.nutritionistClient.findFirst({
    where: { id: linkId, nutritionistId: nutritionist.id, status: "ACCEPTED" },
    select: { id: true, clientId: true, accessUntil: true, autoRenew: true, accessAmount: true, accessUnit: true },
  });
  if (!link) throw new LinkRuleError(t.clientNotFound);
  return { ...link, amount: link.accessAmount, unit: link.accessUnit };
}

/**
 * Quick renew: extends access by the chosen period (a preset, or amount + unit),
 * then returns where it was opened: the client's page or the clients table.
 */
export async function renewClientAccess(linkId: string, formData: FormData) {
  const link = await requireOwnAcceptedLink(linkId);
  const period = parsePeriodChoice(Object.fromEntries(formData), await getActionLocale());
  await prisma.nutritionistClient.update({
    where: { id: link.id },
    data: { accessUntil: renewAccess(link, period, new Date()) },
  });
  revalidatePath("/clients", "layout");
  revalidatePath("/");
  await setFlash("access-renewed");
  // Built from the link's own client and a known filter, never from a URL sent by the browser.
  redirect(renewReturnHref({ returnTo: formData.get("returnTo"), filter: formData.get("filter") }, link.clientId));
}

/**
 * Turns automatic renewal on (with its period, also the renewal default) or off.
 * Off ignores the period fields and keeps the stored period.
 */
export async function setAutoRenew(linkId: string, formData: FormData) {
  const link = await requireOwnAcceptedLink(linkId);
  const choice = parseAutoRenew(Object.fromEntries(formData), await getActionLocale());
  await prisma.nutritionistClient.update({
    where: { id: link.id },
    data: {
      // Keep any period already earned by auto-renewal before changing the settings.
      accessUntil: effectiveAccessUntil(link, new Date()),
      autoRenew: choice.autoRenew,
      ...(choice.autoRenew && { accessAmount: choice.period.amount, accessUnit: choice.period.unit }),
    },
  });
  revalidatePath("/clients", "layout");
  await setFlash("auto-renew-saved");
}
