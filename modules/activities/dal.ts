import "server-only";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireClientAccess } from "@/modules/coaching/dal";
import { requireRole } from "@/modules/identity/dal";
import { dayKey, weeklySummary, type ActivityType, type Intensity, type WeeklySummary } from "./rules";

export type ActivityView = {
  id: string;
  type: ActivityType;
  customName: string | null;
  performedOn: Date;
  durationMinutes: number;
  intensity: Intensity;
  notes: string | null;
};

export type ActivityOverview = {
  /** The instant used for "today", so callers agree on the same day. */
  now: Date;
  summary: WeeklySummary;
  /** Last 30 days, newest first. */
  activities: ActivityView[];
};

const RECENT_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

async function activityOverview(userId: string): Promise<ActivityOverview> {
  await connection();
  const now = new Date();
  // 30 days back always covers the current week (Monday is at most 6 days back).
  const since = new Date(dayKey(now).getTime() - RECENT_DAYS * DAY_MS);

  const activities = await prisma.activity.findMany({
    where: { userId, performedOn: { gte: since } },
    select: {
      id: true,
      type: true,
      customName: true,
      performedOn: true,
      durationMinutes: true,
      intensity: true,
      notes: true,
    },
    orderBy: [{ performedOn: "desc" }, { createdAt: "desc" }],
  });

  return { now, summary: weeklySummary(activities, now), activities };
}

/** The signed-in client's activities: this week's summary and the last 30 days. */
export async function getOwnActivities(): Promise<ActivityOverview> {
  const client = await requireRole("CLIENT");
  return activityOverview(client.id);
}

/**
 * A client's activities, for a nutritionist. Only through the accepted-link
 * gate (404 otherwise).
 */
export async function getClientActivities(clientId: string): Promise<ActivityOverview> {
  await requireClientAccess(clientId);
  return activityOverview(clientId);
}
