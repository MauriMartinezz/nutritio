import "server-only";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { accessState, effectiveAccessUntil, hasActiveAccess } from "@/modules/coaching/access";
import { requireClientAccess } from "@/modules/coaching/dal";
import { requireRole } from "@/modules/identity/dal";
import type { Sex } from "@/modules/clients/preferences";
import {
  asksCycle,
  checkInStatus,
  nextCheckInDue,
  sortMeasurementSites,
  type CheckInState,
  type GymPerformance,
  type Measurement,
  type MeasurementSite,
} from "./rules";

export type CheckInView = {
  id: string;
  createdAt: Date;
  weightKg: number;
  sleep: number;
  completedWorkouts: boolean;
  gymPerformance: GymPerformance | null;
  energy: number;
  hunger: number;
  dietAdherence: number | null;
  discomfort: boolean;
  discomfortNotes: string | null;
  notes: string | null;
  menstruating: boolean | null;
  /** In list order; empty when none were asked. */
  measurements: Measurement[];
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
  completedWorkouts: true,
  gymPerformance: true,
  energy: true,
  hunger: true,
  dietAdherence: true,
  discomfort: true,
  discomfortNotes: true,
  notes: true,
  menstruating: true,
  measurements: { select: { site: true, cm: true } },
} as const;

type Decimal = { toNumber(): number };
type CheckInRow = Omit<CheckInView, "weightKg" | "measurements"> & {
  weightKg: Decimal;
  measurements: { site: MeasurementSite; cm: Decimal }[];
};

// Decimal → number, so the rows can be passed to Client Components.
const toView = (row: CheckInRow): CheckInView => {
  const cm = new Map(row.measurements.map((m) => [m.site, m.cm.toNumber()]));
  return {
    ...row,
    weightKg: row.weightKg.toNumber(),
    measurements: sortMeasurementSites([...cm.keys()]).map((site) => ({ site, cm: cm.get(site)! })),
  };
};

const requestedSites = (rows: { site: MeasurementSite }[]) => sortMeasurementSites(rows.map((row) => row.site));

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
export async function getClientCheckIns(clientId: string): Promise<
  CheckInScheduleView & {
    checkIns: CheckInView[];
    askCycle: boolean;
    /** Body measurements asked in check-ins, in list order. */
    measurements: MeasurementSite[];
    /** Null until the client saves it in their profile. */
    clientSex: Sex | null;
  }
> {
  const { nutritionist } = await requireClientAccess(clientId);

  const link = await prisma.nutritionistClient.findUniqueOrThrow({
    where: { nutritionistId_clientId: { nutritionistId: nutritionist.id, clientId } },
    select: {
      checkInEveryDays: true,
      respondedAt: true,
      askCycle: true,
      measurements: { select: { site: true } },
      client: { select: { preferences: { select: { sex: true } } } },
      checkIns: { select: CHECK_IN_SELECT, orderBy: { createdAt: "desc" } },
    },
  });
  await connection();
  const checkIns = link.checkIns.map(toView);
  return {
    ...schedule(link, checkIns, new Date()),
    checkIns,
    askCycle: link.askCycle,
    measurements: requestedSites(link.measurements),
    clientSex: link.client.preferences?.sex ?? null,
  };
}

export type OwnCheckInLink = CheckInScheduleView & {
  linkId: string;
  /** Show the menstrual cycle question (asked by the nutritionist, client is a woman). */
  askCycle: boolean;
  /** Body measurements the nutritionist asks for, in list order. */
  measurements: MeasurementSite[];
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

  const [links, preferences] = await Promise.all([
    prisma.nutritionistClient.findMany({
      where: { clientId: client.id, status: "ACCEPTED" },
      select: {
        id: true,
        respondedAt: true,
        accessAmount: true,
        accessUnit: true,
        accessUntil: true,
        autoRenew: true,
        checkInEveryDays: true,
        askCycle: true,
        measurements: { select: { site: true } },
        nutritionist: { select: { name: true } },
        checkIns: { select: CHECK_IN_SELECT, orderBy: { createdAt: "desc" } },
      },
      orderBy: { respondedAt: "asc" },
    }),
    prisma.clientPreferences.findUnique({ where: { userId: client.id }, select: { sex: true } }),
  ]);
  await connection();
  const now = new Date();

  return links
    .filter((link) => hasActiveAccess({ ...link, amount: link.accessAmount, unit: link.accessUnit }, now))
    .map((link) => {
      const checkIns = link.checkIns.map(toView);
      return {
        linkId: link.id,
        nutritionistName: link.nutritionist.name,
        askCycle: asksCycle(link.askCycle, preferences?.sex ?? null),
        measurements: requestedSites(link.measurements),
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

export type ClientHomeLink = CheckInScheduleView & {
  linkId: string;
  nutritionistName: string;
  /** End of access in force (auto-renew applied); null if never granted. */
  accessUntil: Date | null;
  accessExpired: boolean;
  latestWeightKg: number | null;
  /** Oldest first, ready for a chart. */
  weightSeries: { date: Date; weightKg: number }[];
};

/**
 * Every accepted link of the signed-in client, expired access included, with
 * access end, check-in schedule and weight evolution. Also returns `now`, so
 * the caller computes days left against the same instant.
 */
export async function getClientHome(): Promise<{ now: Date; links: ClientHomeLink[] }> {
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
      checkIns: { select: { createdAt: true, weightKg: true }, orderBy: { createdAt: "desc" } },
    },
    orderBy: { respondedAt: "asc" },
  });
  await connection();
  const now = new Date();

  return {
    now,
    links: links.map((link) => {
      const access = { ...link, amount: link.accessAmount, unit: link.accessUnit };
      const weights = link.checkIns.map((row) => ({ date: row.createdAt, weightKg: row.weightKg.toNumber() }));
      const due = nextCheckInDue(
        { checkInEveryDays: link.checkInEveryDays, startedAt: link.respondedAt },
        weights[0]?.date ?? null,
      );
      return {
        linkId: link.id,
        nutritionistName: link.nutritionist.name,
        accessUntil: effectiveAccessUntil(access, now),
        accessExpired: accessState(access, now) === "EXPIRED",
        checkInEveryDays: link.checkInEveryDays,
        due,
        ...checkInStatus(due, now),
        latestWeightKg: weights[0]?.weightKg ?? null,
        weightSeries: weights.reverse(),
      };
    }),
  };
}
