import "server-only";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/modules/identity/dal";
import { formatFee } from "@/modules/nutritionists/public-profile";
import { countActiveClients } from "./directory";

export type DirectoryNutritionist = {
  id: string;
  name: string;
  specialty: string | null;
  bio: string | null;
  education: string | null;
  planIncludes: string | null;
  fee: string | null;
  activeClients: number;
  /** The signed-in client's link with this nutritionist, if any. */
  linkStatus: "PENDING" | "ACCEPTED" | "REJECTED" | null;
};

/** Only verified nutritionists are public. */
const where = { role: "NUTRITIONIST", nutritionistStatus: "APPROVED" } as const;

async function load(clientId: string, filter: { id?: string }) {
  const rows = await prisma.user.findMany({
    where: { ...where, ...filter },
    select: {
      id: true,
      name: true,
      specialty: true,
      bio: true,
      education: true,
      planIncludes: true,
      feeAmount: true,
      feeCurrency: true,
      feeDescription: true,
      clientLinks: {
        where: { status: "ACCEPTED" },
        select: { clientId: true, accessUntil: true, autoRenew: true, accessAmount: true, accessUnit: true },
      },
    },
    orderBy: { name: "asc" },
  });
  const own = await prisma.nutritionistClient.findMany({
    where: { clientId, nutritionistId: { in: rows.map((row) => row.id) } },
    select: { nutritionistId: true, status: true },
  });
  await connection();
  const now = new Date();

  return rows.map(
    (row): DirectoryNutritionist => ({
      id: row.id,
      name: row.name,
      specialty: row.specialty,
      bio: row.bio,
      education: row.education,
      planIncludes: row.planIncludes,
      fee: formatFee(row),
      // Only a count leaves the server: never who the other clients are.
      activeClients: countActiveClients(row.clientLinks, now),
      linkStatus: own.find((link) => link.nutritionistId === row.id)?.status ?? null,
    }),
  );
}

/** Verified nutritionists a client can work with. */
export async function getDirectory(): Promise<DirectoryNutritionist[]> {
  const client = await requireRole("CLIENT");
  return load(client.id, {});
}

/** One verified nutritionist's public profile; null when unknown or not verified. */
export async function getDirectoryProfile(id: string): Promise<DirectoryNutritionist | null> {
  const client = await requireRole("CLIENT");
  const [nutritionist] = await load(client.id, { id });
  return nutritionist ?? null;
}
