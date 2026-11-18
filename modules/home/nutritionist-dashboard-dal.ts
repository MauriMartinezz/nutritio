import "server-only";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { ACTIVITY_TYPES } from "@/modules/activities/rules";
import { effectiveAccessUntil } from "@/modules/coaching/access";
import { rosterStatus, type RosterStatus } from "@/modules/coaching/roster";
import { meetingKindLabel } from "@/modules/meetings/rules";
import type { CurrentUser } from "@/modules/identity/dal";
import { latestEvents, startOfMonth } from "./dashboard";

const DAY_MS = 24 * 60 * 60 * 1000;
const FEED_SIZE = 8;

export type DashboardClient = {
  linkId: string;
  clientId: string;
  name: string;
  status: RosterStatus;
  until: Date | null;
  period: { amount: number; unit: "DAY" | "WEEK" | "MONTH" };
};

export type FeedEvent = { id: string; at: Date; clientId: string; name: string; text: string };

/**
 * Everything the approved nutritionist's home dashboard shows. Only clients
 * with an accepted link appear in the activity feed and adherence average.
 */
export async function getNutritionistDashboard(nutritionist: CurrentUser) {
  const links = await prisma.nutritionistClient.findMany({
    where: { nutritionistId: nutritionist.id },
    select: {
      id: true,
      status: true,
      respondedAt: true,
      accessAmount: true,
      accessUnit: true,
      accessUntil: true,
      autoRenew: true,
      client: { select: { id: true, name: true } },
    },
  });
  await connection();
  const now = new Date();
  const since = new Date(now.getTime() - 30 * DAY_MS);
  const accepted = links.filter((link) => link.status === "ACCEPTED");
  const acceptedLinkIds = accepted.map((link) => link.id);
  const acceptedClientIds = accepted.map((link) => link.client.id);

  const [meetings, adherence, checkIns, activities] = await Promise.all([
    prisma.meetingRequest.findMany({
      where: { status: "PENDING", link: { nutritionistId: nutritionist.id } },
      select: { id: true, kind: true, createdAt: true, link: { select: { client: { select: { id: true, name: true } } } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.checkIn.aggregate({
      where: { linkId: { in: acceptedLinkIds }, createdAt: { gte: since }, dietAdherence: { not: null } },
      _avg: { dietAdherence: true },
      _count: { _all: true },
    }),
    prisma.checkIn.findMany({
      where: { linkId: { in: acceptedLinkIds } },
      select: { id: true, weightKg: true, createdAt: true, link: { select: { client: { select: { id: true, name: true } } } } },
      orderBy: { createdAt: "desc" },
      take: FEED_SIZE,
    }),
    prisma.activity.findMany({
      where: { userId: { in: acceptedClientIds } },
      select: { id: true, type: true, customName: true, durationMinutes: true, createdAt: true, user: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
      take: FEED_SIZE,
    }),
  ]);

  const clients: DashboardClient[] = links.map((link) => {
    const access = { ...link, amount: link.accessAmount, unit: link.accessUnit };
    return {
      linkId: link.id,
      clientId: link.client.id,
      name: link.client.name,
      status: rosterStatus(access, now),
      until: link.status === "ACCEPTED" ? effectiveAccessUntil(access, now) : null,
      period: { amount: link.accessAmount, unit: link.accessUnit },
    };
  });
  const byEnd = (a: DashboardClient, b: DashboardClient) => (a.until?.getTime() ?? 0) - (b.until?.getTime() ?? 0);

  const feed: FeedEvent[] = latestEvents(
    [
      ...checkIns.map((checkIn) => ({
        id: `c${checkIn.id}`,
        at: checkIn.createdAt,
        clientId: checkIn.link.client.id,
        name: checkIn.link.client.name,
        text: `checked in at ${checkIn.weightKg.toString()} kg`,
      })),
      ...activities.map((activity) => ({
        id: `a${activity.id}`,
        at: activity.createdAt,
        clientId: activity.user.id,
        name: activity.user.name,
        text: `logged ${activity.customName ?? ACTIVITY_TYPES[activity.type]} · ${activity.durationMinutes} min`,
      })),
    ],
    FEED_SIZE,
  );

  return {
    now,
    activeCount: clients.filter((c) => c.status === "ACTIVE" || c.status === "EXPIRING").length,
    newThisMonth: accepted.filter((link) => link.respondedAt && link.respondedAt >= startOfMonth(now)).length,
    pendingRequests: clients.filter((c) => c.status === "PENDING"),
    meetingRequests: meetings.map((meeting) => ({
      id: meeting.id,
      at: meeting.createdAt,
      clientId: meeting.link.client.id,
      name: meeting.link.client.name,
      kind: meetingKindLabel(meeting.kind),
    })),
    expiring: clients.filter((c) => c.status === "EXPIRING").sort(byEnd),
    expired: clients.filter((c) => c.status === "EXPIRED").sort(byEnd),
    adherence: {
      average: adherence._avg.dietAdherence === null ? null : Math.round(adherence._avg.dietAdherence),
      checkIns: adherence._count._all,
    },
    feed,
  };
}
