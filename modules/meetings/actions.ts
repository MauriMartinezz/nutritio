"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
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
export async function requestMeeting(
  linkId: string,
  _previous: RequestMeetingState,
  formData: FormData,
): Promise<RequestMeetingState> {
  const client = await requireRole("CLIENT");

  // The bound link id is tamperable: it must be one of the caller's own links.
  const link = await prisma.nutritionistClient.findFirst({
    where: { id: linkId, clientId: client.id },
    select: { status: true, accessAmount: true, accessUnit: true, accessUntil: true, autoRenew: true },
  });
  const active =
    link?.status === "ACCEPTED" &&
    hasActiveAccess({ ...link, amount: link.accessAmount, unit: link.accessUnit }, new Date());
  if (!active) return { error: "You can't request meetings with this nutritionist" };

  let request;
  try {
    request = parseMeetingRequest(Object.fromEntries(formData));
    ensureCanRequestMeeting(await prisma.meetingRequest.count({ where: { linkId, status: "PENDING" } }));
  } catch (error) {
    if (error instanceof InvalidMeetingRequestError) return { problems: error.problems };
    if (error instanceof MeetingRuleError) return { error: error.message };
    throw error;
  }

  await prisma.meetingRequest.create({ data: { linkId, ...request } });

  revalidateMeetingPages();
  return { saved: true };
}

/** The nutritionist accepts (with a date) or declines a pending meeting request. */
export async function respondToMeeting(requestId: string, formData: FormData) {
  const nutritionist = await requireRole("NUTRITIONIST");
  if (nutritionist.nutritionistStatus !== "APPROVED") {
    throw new MeetingRuleError("Your profile must be verified to answer meeting requests");
  }

  // The bound request id is tamperable: only pending requests of the caller's own clients.
  const owned = { id: requestId, status: "PENDING" as const, link: { nutritionistId: nutritionist.id } };
  const request = await prisma.meetingRequest.findFirst({ where: owned, select: { id: true } });
  if (!request) throw new MeetingRuleError("Meeting request not found or already answered");

  const now = new Date();
  const response = parseMeetingResponse(Object.fromEntries(formData), now);

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
