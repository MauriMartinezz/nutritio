import "server-only";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireClientAccess } from "@/modules/coaching/dal";
import { requireRole } from "@/modules/identity/dal";
import { activityDashboard, type ActivityDashboard } from "./dashboard";
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
/** The history table covers what the form accepts: up to one year back. */
const HISTORY_DAYS = 366;
const DAY_MS = 24 * 60 * 60 * 1000;

function findActivities(userId: string, since: Date): Promise<ActivityView[]> {
  return prisma.activity.findMany({
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
}

async function activityOverview(userId: string): Promise<ActivityOverview> {
  await connection();
  const now = new Date();
  // 30 days back always covers the current week (Monday is at most 6 days back).
  const activities = await findActivities(userId, new Date(dayKey(now).getTime() - RECENT_DAYS * DAY_MS));

  return { now, summary: weeklySummary(activities, now), activities };
}

/** The signed-in client's activities: this week's summary and the last 30 days. */
export async function getOwnActivities(): Promise<ActivityOverview> {
  const client = await requireRole("CLIENT");
  return activityOverview(client.id);
}

export type ActivityLog = {
  /** The instant used for "today", so callers agree on the same day. */
  now: Date;
  dashboard: ActivityDashboard;
  /** Last 12 months, newest first. */
  activities: ActivityView[];
};

/** The signed-in client's dashboard (this vs last week, 8 weeks of minutes) and 12-month history. */
export async function getOwnActivityLog(): Promise<ActivityLog> {
  const client = await requireRole("CLIENT");
  await connection();
  const now = new Date();
  const activities = await findActivities(client.id, new Date(dayKey(now).getTime() - HISTORY_DAYS * DAY_MS));
  return { now, dashboard: activityDashboard(activities, now), activities };
}

/**
 * A client's activities, for a nutritionist. Only through the accepted-link
 * gate (404 otherwise).
 */
export async function getClientActivities(clientId: string): Promise<ActivityOverview> {
  await requireClientAccess(clientId);
  return activityOverview(clientId);
}
