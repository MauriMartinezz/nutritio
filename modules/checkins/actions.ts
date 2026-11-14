"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hasActiveAccess } from "@/modules/coaching/access";
import { requireClientAccess } from "@/modules/coaching/dal";
import { requireRole } from "@/modules/identity/dal";
import { setFlash } from "@/modules/ui/set-flash";
import { InvalidCheckInError, asksCycle, parseCheckIn, parseFrequency } from "./rules";

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

/** The nutritionist turns the menstrual cycle question on or off for a client who is a woman. */
export async function setCycleQuestion(clientId: string, formData: FormData) {
  const { nutritionist } = await requireClientAccess(clientId);
  const askCycle = formData.get("askCycle") === "on";

  // Only women can be asked; the client's sex is read from the DB, never from the browser.
  const preferences = await prisma.clientPreferences.findUnique({ where: { userId: clientId }, select: { sex: true } });
  if (askCycle && preferences?.sex !== "FEMALE") return;

  await prisma.nutritionistClient.updateMany({
    where: { nutritionistId: nutritionist.id, clientId, status: "ACCEPTED" },
    data: { askCycle },
  });

  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/check-ins");
}

export type SubmitCheckInState = {
  problems?: Record<string, string>;
  error?: string;
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
    select: {
      status: true,
      accessAmount: true,
      accessUnit: true,
      accessUntil: true,
      autoRenew: true,
      askCycle: true,
      client: { select: { preferences: { select: { sex: true } } } },
    },
  });
  const active =
    link?.status === "ACCEPTED" &&
    hasActiveAccess({ ...link, amount: link.accessAmount, unit: link.accessUnit }, new Date());
  if (!active) return { error: "You can't send check-ins to this nutritionist" };

  let checkIn;
  try {
    checkIn = parseCheckIn(Object.fromEntries(formData), {
      askCycle: asksCycle(link.askCycle, link.client.preferences?.sex ?? null),
    });
  } catch (error) {
    if (error instanceof InvalidCheckInError) return { problems: error.problems };
    throw error;
  }

  await prisma.checkIn.create({ data: { linkId, ...checkIn } });

  revalidatePath("/check-ins");
  revalidatePath("/");
  await setFlash("check-in-sent");
  redirect("/");
}
