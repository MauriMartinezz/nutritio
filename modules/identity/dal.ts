import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { NutritionistStatus, Role } from "./roles";

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  nutritionistStatus: NutritionistStatus | null;
};

/**
 * Reads the session and returns the user as stored in the database, so role
 * and verification status are always fresh. Returns null when signed out.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;

  return prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, role: true, nutritionistStatus: true },
  });
});

/** Use in pages and Server Actions that need a signed-in user. */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  return user;
}

/** Use in pages and Server Actions restricted to some roles. */
export async function requireRole(...roles: Role[]): Promise<CurrentUser> {
  const user = await requireUser();
  if (!roles.includes(user.role)) redirect("/");
  return user;
}
