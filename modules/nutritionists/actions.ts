"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/modules/identity/dal";
import {
  InvalidAdminUpdateError,
  changeNutritionistStatus,
  parseAdminNutritionistUpdate,
} from "./verification";

async function findNutritionistOrThrow(nutritionistId: string) {
  const target = await prisma.user.findUnique({
    where: { id: nutritionistId },
    select: { role: true, nutritionistStatus: true, email: true },
  });
  if (!target) throw new Error("Nutritionist not found");
  return target;
}

/** Quick status change from the admin list (approve, reject, revoke). */
export async function setNutritionistStatus(nutritionistId: string, status: string) {
  await requireRole("ADMIN");

  const target = await findNutritionistOrThrow(nutritionistId);
  const newStatus = changeNutritionistStatus(target, status);

  await prisma.user.updateMany({
    where: { id: nutritionistId, role: "NUTRITIONIST" },
    data: { nutritionistStatus: newStatus },
  });

  revalidatePath("/admin");
}

export type UpdateNutritionistState = {
  problems?: Record<string, string>;
  saved?: boolean;
};

/** Full edit from the admin form (used with useActionState). */
export async function updateNutritionist(
  nutritionistId: string,
  _previous: UpdateNutritionistState,
  formData: FormData,
): Promise<UpdateNutritionistState> {
  await requireRole("ADMIN");

  const target = await findNutritionistOrThrow(nutritionistId);
  if (target.role !== "NUTRITIONIST") return { problems: { form: "This user is not a nutritionist" } };

  let update;
  try {
    update = parseAdminNutritionistUpdate(Object.fromEntries(formData));
  } catch (error) {
    if (error instanceof InvalidAdminUpdateError) return { problems: error.problems };
    throw error;
  }

  const { status, ...fields } = update;
  const emailChanged = fields.email !== target.email.toLowerCase();

  try {
    await prisma.user.update({
      where: { id: nutritionistId, role: "NUTRITIONIST" },
      data: {
        ...fields,
        nutritionistStatus: status,
        // A new login email has not been verified by its owner.
        ...(emailChanged && { emailVerified: false }),
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const target = String(error.meta?.target ?? "");
      return {
        problems: target.includes("dni")
          ? { dni: "DNI is already registered" }
          : { email: "Email is already in use" },
      };
    }
    throw error;
  }

  revalidatePath("/admin");
  revalidatePath(`/admin/nutritionists/${nutritionistId}`);
  return { saved: true };
}
