"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getActionLocale } from "@/lib/i18n/server";
import { prisma } from "@/lib/prisma";
import { hasActiveAccess } from "@/modules/coaching/access";
import { parseRosterFilter, rosterHref } from "@/modules/coaching/roster";
import { setFlash } from "@/modules/ui/set-flash";
import { requireRole } from "@/modules/identity/dal";
import {
  InvalidMeetingRequestError,
  MeetingRuleError,
  ensureCanRequestMeeting,
  parseMeetingRequest,
  parseMeetingResponse,
} from "./rules";
import { meetingTerms } from "./messages";

export type RequestMeetingState = {
  problems?: Record<string, string>;
  error?: string;
  saved?: boolean;
};

function revalidateMeetingPages() {
  revalidatePath("/meetings");
  revalidatePath("/clients");
  revalidatePath("/");
}

/** The signed-in client asks one nutritionist for a meeting (used with useActionState). */
export async function requestMeeting(_previous: RequestMeetingState, formData: FormData): Promise<RequestMeetingState> {
  const client = await requireRole("CLIENT");
  const locale = await getActionLocale();
  // From the form, not .bind(): a bound useActionState action left the no-JS
  // response of a rejected submission hanging.
  const linkId = String(formData.get("linkId") ?? "");

  // The link id comes from the browser: it must be one of the caller's own links.
  const link = await prisma.nutritionistClient.findFirst({
    where: { id: linkId, clientId: client.id },
    select: { status: true, accessAmount: true, accessUnit: true, accessUntil: true, autoRenew: true },
  });
  const active =
    link?.status === "ACCEPTED" &&
    hasActiveAccess({ ...link, amount: link.accessAmount, unit: link.accessUnit }, new Date());
  if (!active) return { error: meetingTerms[locale].errors.notAllowed };

  let request;
  try {
    request = parseMeetingRequest(Object.fromEntries(formData), locale);
    ensureCanRequestMeeting(await prisma.meetingRequest.count({ where: { linkId, status: "PENDING" } }), locale);
  } catch (error) {
    if (error instanceof InvalidMeetingRequestError) return { problems: error.problems };
    if (error instanceof MeetingRuleError) return { error: error.message };
    throw error;
  }

  await prisma.meetingRequest.create({ data: { linkId, ...request } });

  revalidateMeetingPages();
  // The refreshed page replaces the form with the "pending" notice: the toast comes from the flash.
  await setFlash("meeting-requested");
  return { saved: true };
}

/** The nutritionist accepts (with a date) or declines a pending meeting request. */
export async function respondToMeeting(requestId: string, formData: FormData) {
  const nutritionist = await requireRole("NUTRITIONIST");
  const locale = await getActionLocale();
  const t = meetingTerms[locale].errors;
  if (nutritionist.nutritionistStatus !== "APPROVED") {
    throw new MeetingRuleError(t.notVerified);
  }

  // The bound request id is tamperable: only pending requests of the caller's own clients.
  const owned = { id: requestId, status: "PENDING" as const, link: { nutritionistId: nutritionist.id } };
  const request = await prisma.meetingRequest.findFirst({ where: owned, select: { id: true } });
  if (!request) throw new MeetingRuleError(t.notFound);

  const now = new Date();
  const response = parseMeetingResponse(Object.fromEntries(formData), now, locale);

  // Conditional on PENDING, so two answers sent at once cannot both apply.
  await prisma.meetingRequest.updateMany({
    where: { id: request.id, status: "PENDING" },
    data: { ...response, respondedAt: now },
  });

  revalidateMeetingPages();
  await setFlash(response.status === "ACCEPTED" ? "meeting-accepted" : "meeting-declined");
  // Back to the clients table (same filter); the URL is never taken from the browser.
  redirect(rosterHref(parseRosterFilter(formData.get("filter"))));
}
