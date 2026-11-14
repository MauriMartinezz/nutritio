import "server-only";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { hasActiveAccess } from "@/modules/coaching/access";
import { getCurrentUser, requireRole } from "@/modules/identity/dal";
import { pendingActionCount, type MeetingKind, type MeetingStatus } from "./rules";

export type MeetingView = {
  id: string;
  kind: MeetingKind;
  message: string | null;
  preferredTimes: string | null;
  status: MeetingStatus;
  scheduledFor: Date | null;
  responseNote: string | null;
  createdAt: Date;
};

const MEETING_SELECT = {
  id: true,
  kind: true,
  message: true,
  preferredTimes: true,
  status: true,
  scheduledFor: true,
  responseNote: true,
  createdAt: true,
} as const;

export type OwnMeetingLink = {
  linkId: string;
  nutritionistName: string;
  /** Newest first. */
  requests: MeetingView[];
  hasPending: boolean;
};

/** The signed-in client's active nutritionists, each with the client's meeting requests. */
export async function getOwnMeetings(): Promise<OwnMeetingLink[]> {
  const client = await requireRole("CLIENT");

  const links = await prisma.nutritionistClient.findMany({
    where: { clientId: client.id, status: "ACCEPTED" },
    select: {
      id: true,
      accessAmount: true,
      accessUnit: true,
      accessUntil: true,
      autoRenew: true,
      nutritionist: { select: { name: true } },
      meetingRequests: { select: MEETING_SELECT, orderBy: { createdAt: "desc" } },
    },
    orderBy: { respondedAt: "asc" },
  });
  await connection();
  const now = new Date();

  return links
    .filter((link) => hasActiveAccess({ ...link, amount: link.accessAmount, unit: link.accessUnit }, now))
    .map((link) => ({
      linkId: link.id,
      nutritionistName: link.nutritionist.name,
      requests: link.meetingRequests,
      hasPending: link.meetingRequests.some((request) => request.status === "PENDING"),
    }));
}

export type NutritionistMeetingView = MeetingView & { client: { id: string; name: string } };

/**
 * Meeting requests of the signed-in approved nutritionist's clients: pending
 * ones (oldest first) and upcoming accepted ones (soonest first).
 */
export async function getNutritionistMeetings(): Promise<{
  pending: NutritionistMeetingView[];
  upcoming: NutritionistMeetingView[];
  now: Date;
}> {
  const nutritionist = await requireRole("NUTRITIONIST");
  if (nutritionist.nutritionistStatus !== "APPROVED") return { pending: [], upcoming: [], now: new Date(0) };

  await connection();
  const now = new Date();
  const select = { ...MEETING_SELECT, link: { select: { client: { select: { id: true, name: true } } } } };
  const owned = { link: { nutritionistId: nutritionist.id } };

  const [pending, upcoming] = await Promise.all([
    prisma.meetingRequest.findMany({
      where: { ...owned, status: "PENDING" },
      select,
      orderBy: { createdAt: "asc" },
    }),
    prisma.meetingRequest.findMany({
      where: { ...owned, status: "ACCEPTED", scheduledFor: { gte: now } },
      select,
      orderBy: { scheduledFor: "asc" },
    }),
  ]);

  const toView = ({ link, ...request }: (typeof pending)[number]) => ({ ...request, client: link.client });
  return { pending: pending.map(toView), upcoming: upcoming.map(toView), now };
}

/**
 * Number of things the signed-in nutritionist must act on (pending link
 * requests + pending meeting requests). 0 for anyone else.
 */
export async function getPendingActionCount(): Promise<number> {
  const user = await getCurrentUser();
  if (!user || user.role !== "NUTRITIONIST" || user.nutritionistStatus !== "APPROVED") return 0;

  const [pendingLinkRequests, pendingMeetingRequests] = await Promise.all([
    prisma.nutritionistClient.count({ where: { nutritionistId: user.id, status: "PENDING" } }),
    prisma.meetingRequest.count({ where: { status: "PENDING", link: { nutritionistId: user.id } } }),
  ]);
  return pendingActionCount({ pendingLinkRequests, pendingMeetingRequests });
}
