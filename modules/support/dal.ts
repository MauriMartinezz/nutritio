import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole, requireUser } from "@/modules/identity/dal";
import { ROLES, type Role } from "@/modules/identity/roles";

const REQUEST_SELECT = {
  id: true,
  title: true,
  description: true,
  status: true,
  reply: true,
  repliedAt: true,
  resolvedAt: true,
  createdAt: true,
} as const;

export type SupportStatusFilter = "OPEN" | "RESOLVED" | "ALL";

export function parseStatusFilter(value: unknown): SupportStatusFilter {
  return value === "RESOLVED" || value === "ALL" ? value : "OPEN";
}

/** The signed-in user's own requests, newest first. */
export async function getOwnSupportRequests() {
  const user = await requireUser();
  return prisma.supportRequest.findMany({
    where: { userId: user.id },
    select: REQUEST_SELECT,
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

/** Admin inbox: oldest open requests first, so none waits forever. */
export async function listSupportRequests(status: SupportStatusFilter) {
  await requireRole("ADMIN");
  return prisma.supportRequest.findMany({
    where: status === "ALL" ? {} : { status },
    select: { ...REQUEST_SELECT, user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: status === "OPEN" ? "asc" : "desc" },
    take: 200,
  });
}

export async function getSupportRequest(id: string) {
  await requireRole("ADMIN");
  return prisma.supportRequest.findUnique({
    where: { id },
    select: { ...REQUEST_SELECT, user: { select: { id: true, name: true, email: true, role: true } } },
  });
}

export function parseRoleFilter(value: unknown): Role | "ALL" {
  return (ROLES as readonly unknown[]).includes(value) ? (value as Role) : "ALL";
}

/** Admin user search by name or email. */
export async function listUsers({ query, role }: { query: string; role: Role | "ALL" }) {
  await requireRole("ADMIN");
  const where: Prisma.UserWhereInput = {
    ...(role !== "ALL" && { role }),
    ...(query && {
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { email: { contains: query, mode: "insensitive" } },
      ],
    }),
  };
  return prisma.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      _count: { select: { supportRequests: { where: { status: "OPEN" } } } },
    },
    orderBy: { name: "asc" },
    take: 200,
  });
}

/** One user for the admin, with every request they sent. */
export async function getUserForAdmin(id: string) {
  await requireRole("ADMIN");
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      emailVerified: true,
      role: true,
      createdAt: true,
      supportRequests: { select: REQUEST_SELECT, orderBy: { createdAt: "desc" } },
    },
  });
}

export type SupportRequestView = Awaited<ReturnType<typeof getOwnSupportRequests>>[number];
