"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { hasActiveAccess } from "@/modules/coaching/access";
import { requireClientAccess } from "@/modules/coaching/dal";
import { requireRole } from "@/modules/identity/dal";
import { InvalidCheckInError, parseCheckIn, parseFrequency } from "./rules";

/** The nutritionist agrees how often (in days) a client sends a check-in. */
export async function setCheckInFrequency(clientId: string, formData: FormData) {
  // Approved nutritionist with an accepted link to this client (404 otherwise).
  const { nutritionist } = await requireClientAccess(clientId);
  const checkInEveryDays = parseFrequency(formData.get("checkInEveryDays"));

  // Only the caller's own link; the nutritionist id never comes from the browser.
  await prisma.nutritionistClient.updateMany({
    where: { nutritionistId: nutritionist.id, clientId, status: "ACCEPTED" },
    data: { checkInEveryDays },
  });

  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/check-ins");
}

export type SubmitCheckInState = {
  problems?: Record<string, string>;
  error?: string;
  saved?: boolean;
};

/** The signed-in client sends a check-in to one nutritionist (used with useActionState). */
export async function submitCheckIn(
  linkId: string,
  _previous: SubmitCheckInState,
  formData: FormData,
): Promise<SubmitCheckInState> {
  const client = await requireRole("CLIENT");

  // The bound link id is tamperable: it must be one of the caller's own links.
  const link = await prisma.nutritionistClient.findFirst({
    where: { id: linkId, clientId: client.id },
    select: { status: true, accessAmount: true, accessUnit: true, accessUntil: true, autoRenew: true },
  });
  const active =
    link?.status === "ACCEPTED" &&
    hasActiveAccess({ ...link, amount: link.accessAmount, unit: link.accessUnit }, new Date());
  if (!active) return { error: "You can't send check-ins to this nutritionist" };

  let checkIn;
  try {
    checkIn = parseCheckIn(Object.fromEntries(formData));
  } catch (error) {
    if (error instanceof InvalidCheckInError) return { problems: error.problems };
    throw error;
  }

  await prisma.checkIn.create({ data: { linkId, ...checkIn } });

  revalidatePath("/check-ins");
  revalidatePath("/");
  return { saved: true };
}
