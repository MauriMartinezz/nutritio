"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { uniqueViolationIndex } from "@/lib/prisma-errors";
import { requireRole } from "@/modules/identity/dal";
import {
  InvalidAdminUpdateError,
  changeNutritionistStatus,
  parseAdminNutritionistUpdate,
} from "./verification";
import { InvalidPublicProfileError, parsePublicProfile } from "./public-profile";

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
    const index = uniqueViolationIndex(error);
    if (index !== null) {
      return {
        problems: index.includes("dni")
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

export type UpdatePublicProfileState = {
  problems?: Record<string, string>;
  saved?: boolean;
};

/** The signed-in nutritionist edits their own public profile (used with useActionState). */
export async function updatePublicProfile(
  _previous: UpdatePublicProfileState,
  formData: FormData,
): Promise<UpdatePublicProfileState> {
  const nutritionist = await requireRole("NUTRITIONIST");

  let profile;
  try {
    profile = parsePublicProfile(Object.fromEntries(formData));
  } catch (error) {
    if (error instanceof InvalidPublicProfileError) return { problems: error.problems };
    throw error;
  }

  // Only the caller's own row, and only the public profile fields.
  await prisma.user.update({
    where: { id: nutritionist.id, role: "NUTRITIONIST" },
    data: {
      bio: profile.bio,
      education: profile.education,
      planIncludes: profile.planIncludes,
      feeAmount: profile.feeAmount,
      feeCurrency: profile.feeCurrency,
      feeDescription: profile.feeDescription,
    },
  });

  revalidatePath("/profile");
  revalidatePath("/nutritionists");
  return { saved: true };
}
