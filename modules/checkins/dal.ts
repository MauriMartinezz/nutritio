import "server-only";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { hasActiveAccess } from "@/modules/coaching/access";
import { requireClientAccess } from "@/modules/coaching/dal";
import { requireRole } from "@/modules/identity/dal";
import { checkInStatus, nextCheckInDue, type CheckInState } from "./rules";

export type CheckInView = {
  id: string;
  createdAt: Date;
  weightKg: number;
  sleep: number;
  trainingAdherence: number;
  energy: number;
  hunger: number;
  discomfort: boolean;
  discomfortNotes: string | null;
  notes: string | null;
};

export type CheckInScheduleView = {
  checkInEveryDays: number | null;
  due: Date | null;
  state: CheckInState;
  daysLeft: number;
};

const CHECK_IN_SELECT = {
  id: true,
  createdAt: true,
  weightKg: true,
  sleep: true,
  trainingAdherence: true,
  energy: true,
  hunger: true,
  discomfort: true,
  discomfortNotes: true,
  notes: true,
} as const;

type CheckInRow = Omit<CheckInView, "weightKg"> & { weightKg: { toNumber(): number } };

// Decimal → number, so the rows can be passed to Client Components.
const toView = (row: CheckInRow): CheckInView => ({ ...row, weightKg: row.weightKg.toNumber() });

function schedule(
  link: { checkInEveryDays: number | null; respondedAt: Date | null },
  newestFirst: CheckInView[],
  now: Date,
): CheckInScheduleView {
  const due = nextCheckInDue(
    { checkInEveryDays: link.checkInEveryDays, startedAt: link.respondedAt },
    newestFirst[0]?.createdAt ?? null,
  );
  return { checkInEveryDays: link.checkInEveryDays, due, ...checkInStatus(due, now) };
}

/**
 * A client's check-ins and schedule with the signed-in nutritionist. Health
 * data: only through the accepted-link gate (404 otherwise).
 */
export async function getClientCheckIns(
  clientId: string,
): Promise<CheckInScheduleView & { checkIns: CheckInView[] }> {
  const { nutritionist } = await requireClientAccess(clientId);

  const link = await prisma.nutritionistClient.findUniqueOrThrow({
    where: { nutritionistId_clientId: { nutritionistId: nutritionist.id, clientId } },
    select: {
      checkInEveryDays: true,
      respondedAt: true,
      checkIns: { select: CHECK_IN_SELECT, orderBy: { createdAt: "desc" } },
    },
  });
  await connection();
  const checkIns = link.checkIns.map(toView);
  return { ...schedule(link, checkIns, new Date()), checkIns };
}

export type OwnCheckInLink = CheckInScheduleView & {
  linkId: string;
  nutritionistName: string;
  /** Newest first. */
  checkIns: CheckInView[];
};

/**
 * The signed-in client's working relationships that accept check-ins:
 * accepted links whose access is still active.
 */
export async function getOwnCheckIns(): Promise<OwnCheckInLink[]> {
  const client = await requireRole("CLIENT");

  const links = await prisma.nutritionistClient.findMany({
    where: { clientId: client.id, status: "ACCEPTED" },
    select: {
      id: true,
      respondedAt: true,
      accessAmount: true,
      accessUnit: true,
      accessUntil: true,
      autoRenew: true,
      checkInEveryDays: true,
      nutritionist: { select: { name: true } },
      checkIns: { select: CHECK_IN_SELECT, orderBy: { createdAt: "desc" } },
    },
    orderBy: { respondedAt: "asc" },
  });
  await connection();
  const now = new Date();

  return links
    .filter((link) => hasActiveAccess({ ...link, amount: link.accessAmount, unit: link.accessUnit }, now))
    .map((link) => {
      const checkIns = link.checkIns.map(toView);
      return {
        linkId: link.id,
        nutritionistName: link.nutritionist.name,
        ...schedule(link, checkIns, now),
        checkIns,
      };
    });
}

export type ClientCheckInSummary = {
  linkId: string;
  nutritionistName: string;
  state: CheckInState;
  due: Date | null;
  daysLeft: number;
  latestWeightKg: number | null;
  /** Oldest first, ready for a chart. */
  weightSeries: { date: Date; weightKg: number }[];
};

/** Per active link of the signed-in client: check-in status and weight evolution. */
export async function getClientCheckInSummary(): Promise<ClientCheckInSummary[]> {
  const links = await getOwnCheckIns();
  return links.map((link) => ({
    linkId: link.linkId,
    nutritionistName: link.nutritionistName,
    state: link.state,
    due: link.due,
    daysLeft: link.daysLeft,
    latestWeightKg: link.checkIns[0]?.weightKg ?? null,
    weightSeries: link.checkIns
      .map((checkIn) => ({ date: checkIn.createdAt, weightKg: checkIn.weightKg }))
      .reverse(),
  }));
}
