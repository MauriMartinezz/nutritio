"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/modules/identity/dal";
import { decideVerification, type VerificationDecision } from "./verification";

async function verifyNutritionist(nutritionistId: string, decision: VerificationDecision) {
  await requireRole("ADMIN");

  const target = await prisma.user.findUnique({
    where: { id: nutritionistId },
    select: { role: true, nutritionistStatus: true },
  });
  if (!target) throw new Error("Nutritionist not found");

  const newStatus = decideVerification(target, decision);

  // Conditional update: if another admin decided first, nothing changes.
  const { count } = await prisma.user.updateMany({
    where: { id: nutritionistId, role: "NUTRITIONIST", nutritionistStatus: "PENDING" },
    data: { nutritionistStatus: newStatus },
  });
  if (count === 0) throw new Error("Nutritionist was already verified");

  revalidatePath("/admin");
}

export async function approveNutritionist(nutritionistId: string) {
  await verifyNutritionist(nutritionistId, "APPROVE");
}

export async function rejectNutritionist(nutritionistId: string) {
  await verifyNutritionist(nutritionistId, "REJECT");
}
