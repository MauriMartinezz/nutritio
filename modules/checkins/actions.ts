"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getActionLocale } from "@/lib/i18n/server";
import { prisma } from "@/lib/prisma";
import { hasActiveAccess } from "@/modules/coaching/access";
import { requireClientAccess } from "@/modules/coaching/dal";
import { requireRole } from "@/modules/identity/dal";
import { setFlash } from "@/modules/ui/set-flash";
import { checkInMessages } from "./messages";
import {
  CheckInRuleError,
  InvalidCheckInError,
  asksCycle,
  parseCheckIn,
  parseFrequency,
  parseMeasurementSite,
} from "./rules";

/** The nutritionist agrees how often (in days) a client sends a check-in. */
export async function setCheckInFrequency(clientId: string, formData: FormData) {
  // Approved nutritionist with an accepted link to this client (404 otherwise).
  const { nutritionist } = await requireClientAccess(clientId);
  const checkInEveryDays = parseFrequency(formData.get("checkInEveryDays"), await getActionLocale());

  // Only the caller's own link; the nutritionist id never comes from the browser.
  await prisma.nutritionistClient.updateMany({
    where: { nutritionistId: nutritionist.id, clientId, status: "ACCEPTED" },
    data: { checkInEveryDays },
  });

  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/check-ins");
  await setFlash("frequency-saved");
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
  await setFlash(askCycle ? "cycle-question-on" : "cycle-question-off");
}

/** The nutritionist adds a body measurement to a client's check-ins, or removes it. */
export async function setRequestedMeasurement(clientId: string, formData: FormData) {
  const { nutritionist } = await requireClientAccess(clientId);
  const adding = formData.has("add");
  let site;
  try {
    site = parseMeasurementSite(formData.get(adding ? "add" : "remove"));
  } catch (error) {
    if (error instanceof CheckInRuleError) return;
    throw error;
  }

  // Only the caller's own accepted link; the nutritionist id never comes from the browser.
  const link = await prisma.nutritionistClient.findFirst({
    where: { nutritionistId: nutritionist.id, clientId, status: "ACCEPTED" },
    select: { id: true },
  });
  if (!link) return;

  if (adding) {
    await prisma.requestedMeasurement.upsert({
      where: { linkId_site: { linkId: link.id, site } },
      create: { linkId: link.id, site },
      update: {},
    });
  } else {
    await prisma.requestedMeasurement.deleteMany({ where: { linkId: link.id, site } });
  }

  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/check-ins");
  await setFlash(adding ? "measurement-added" : "measurement-removed");
}

export type SubmitCheckInState = {
  problems?: Record<string, string>;
  error?: string;
  /** What was sent, so a rejected form shows it again instead of coming back empty. */
  values?: Record<string, string>;
};

/**
 * The signed-in client sends a check-in to one nutritionist (used with
 * useActionState). The link id comes in the form, not bound with .bind():
 * a bound useActionState action left the no-JS response of a rejected
 * submission hanging.
 */
/** The text fields the user filled in (React's internal `$ACTION_*` entries left out). */
function sentValues(formData: FormData): Record<string, string> {
  const values: Record<string, string> = {};
  for (const [name, value] of formData) {
    if (typeof value === "string" && !name.startsWith("$") && name !== "linkId") values[name] = value;
  }
  return values;
}

export async function submitCheckIn(_previous: SubmitCheckInState, formData: FormData): Promise<SubmitCheckInState> {
  const client = await requireRole("CLIENT");
  const locale = await getActionLocale();
  const linkId = String(formData.get("linkId") ?? "");

  // The link id comes from the browser: it must be one of the caller's own links.
  const link = await prisma.nutritionistClient.findFirst({
    where: { id: linkId, clientId: client.id },
    select: {
      status: true,
      accessAmount: true,
      accessUnit: true,
      accessUntil: true,
      autoRenew: true,
      askCycle: true,
      measurements: { select: { site: true } },
      client: { select: { preferences: { select: { sex: true } } } },
    },
  });
  const active =
    link?.status === "ACCEPTED" &&
    hasActiveAccess({ ...link, amount: link.accessAmount, unit: link.accessUnit }, new Date());
  if (!active) return { error: checkInMessages[locale].cantSend };

  let checkIn;
  try {
    checkIn = parseCheckIn(Object.fromEntries(formData), {
      askCycle: asksCycle(link.askCycle, link.client.preferences?.sex ?? null),
      measurements: link.measurements.map((row) => row.site),
      locale,
    });
  } catch (error) {
    if (error instanceof InvalidCheckInError) return { problems: error.problems, values: sentValues(formData) };
    throw error;
  }

  const { measurements, ...fields } = checkIn;
  await prisma.checkIn.create({ data: { linkId, ...fields, measurements: { create: measurements } } });

  revalidatePath("/check-ins");
  revalidatePath("/");
  await setFlash("check-in-sent");
  redirect("/");
}
