"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/modules/identity/dal";
import { InvalidActivityError, parseActivity } from "./rules";

export type LogActivityState = {
  problems?: Record<string, string>;
  saved?: boolean;
};

/** The signed-in client logs one of their own activities (used with useActionState). */
export async function logActivity(_previous: LogActivityState, formData: FormData): Promise<LogActivityState> {
  const client = await requireRole("CLIENT");

  let activity;
  try {
    activity = parseActivity(Object.fromEntries(formData), new Date());
  } catch (error) {
    if (error instanceof InvalidActivityError) return { problems: error.problems };
    throw error;
  }

  // The owner always comes from the session, never from the form.
  await prisma.activity.create({ data: { userId: client.id, ...activity } });

  revalidatePath("/activities");
  return { saved: true };
}

/** Deletes one of the signed-in client's activities. */
export async function deleteActivity(activityId: string) {
  const client = await requireRole("CLIENT");

  // The bound id is tamperable: only delete it when it belongs to the caller.
  await prisma.activity.deleteMany({ where: { id: activityId, userId: client.id } });

  revalidatePath("/activities");
}
