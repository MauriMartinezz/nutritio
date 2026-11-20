"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { uniqueViolationIndex } from "@/lib/prisma-errors";
import { getActionLocale } from "@/lib/i18n/server";
import { requireRole } from "@/modules/identity/dal";
import { setFlash } from "@/modules/ui/set-flash";
import { nutritionistErrors } from "./messages";
import {
  InvalidAdminUpdateError,
  InvalidVerificationError,
  assertCanResubmit,
  parseAdminNutritionistUpdate,
  parseReviewNote,
  reviewStatus,
} from "./verification";
import { InvalidProfileError, parseNutritionistProfile } from "./profile";
import { InvalidPublicProfileError, parsePublicProfile } from "./public-profile";

async function findNutritionistOrThrow(nutritionistId: string) {
  const target = await prisma.user.findUnique({
    where: { id: nutritionistId },
    select: { role: true, nutritionistStatus: true, email: true },
  });
  if (!target) throw new Error("Nutritionist not found");
  return target;
}

export type ReviewNutritionistState = {
  problems?: Record<string, string>;
  /** The status after a successful save. */
  saved?: "PENDING" | "APPROVED" | "REJECTED";
};

/**
 * Review panel: the admin corrects the application, leaves a note for the
 * nutritionist and approves, rejects or just saves (used with useActionState).
 */
export async function reviewNutritionist(
  _previous: ReviewNutritionistState,
  formData: FormData,
): Promise<ReviewNutritionistState> {
  await requireRole("ADMIN");
  // From the form, not .bind(): a bound useActionState action left the no-JS
  // response of a rejected submission hanging. Admin-only, and looked up below.
  const nutritionistId = String(formData.get("nutritionistId") ?? "");

  const target = await findNutritionistOrThrow(nutritionistId);
  const locale = await getActionLocale();
  const t = nutritionistErrors[locale];
  if (target.role !== "NUTRITIONIST") return { problems: { form: t.userNotNutritionist } };

  const input = Object.fromEntries(formData);
  let update;
  let note;
  let status;
  try {
    status = reviewStatus(input.decision, target.nutritionistStatus, locale);
  } catch (error) {
    if (error instanceof InvalidVerificationError) return { problems: { decision: error.message } };
    throw error;
  }
  try {
    note = parseReviewNote(input.note, locale);
    update = parseAdminNutritionistUpdate({ ...input, status }, new Date(), locale);
  } catch (error) {
    if (error instanceof InvalidAdminUpdateError) return { problems: error.problems };
    if (error instanceof InvalidVerificationError) return { problems: { note: error.message } };
    throw error;
  }

  const { status: newStatus, ...fields } = update;
  const emailChanged = fields.email !== target.email.toLowerCase();
  const decided = input.decision !== "save";

  try {
    await prisma.user.update({
      where: { id: nutritionistId, role: "NUTRITIONIST" },
      data: {
        ...fields,
        nutritionistStatus: newStatus,
        verificationNote: note,
        ...(decided && { reviewedAt: new Date() }),
        // A new login email has not been verified by its owner.
        ...(emailChanged && { emailVerified: false }),
      },
    });
  } catch (error) {
    const index = uniqueViolationIndex(error);
    if (index !== null) {
      return {
        problems: index.includes("dni")
          ? { dni: t.dniTaken }
          : { email: t.emailTaken },
      };
    }
    throw error;
  }

  revalidatePath("/admin");
  return { saved: newStatus };
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
    profile = parsePublicProfile(Object.fromEntries(formData), await getActionLocale());
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

export type ResubmitApplicationState = {
  problems?: Record<string, string>;
  sent?: boolean;
};

/**
 * A rejected nutritionist corrects their data and sends the application again
 * (used with useActionState). It goes back to PENDING for the admins.
 */
export async function resubmitApplication(
  _previous: ResubmitApplicationState,
  formData: FormData,
): Promise<ResubmitApplicationState> {
  const nutritionist = await requireRole("NUTRITIONIST");
  const locale = await getActionLocale();
  const t = nutritionistErrors[locale];

  let profile;
  try {
    assertCanResubmit(nutritionist.nutritionistStatus, locale);
    profile = parseNutritionistProfile(Object.fromEntries(formData), new Date(), locale);
  } catch (error) {
    if (error instanceof InvalidVerificationError) return { problems: { form: error.message } };
    if (error instanceof InvalidProfileError) return { problems: error.problems };
    throw error;
  }

  try {
    // Only while still REJECTED: two quick submissions can't both go through.
    const { count } = await prisma.user.updateMany({
      where: { id: nutritionist.id, role: "NUTRITIONIST", nutritionistStatus: "REJECTED" },
      data: { ...profile, nutritionistStatus: "PENDING" },
    });
    if (count === 0) return { problems: { form: t.alreadyPending } };
  } catch (error) {
    if (uniqueViolationIndex(error) !== null) return { problems: { dni: t.dniTaken } };
    throw error;
  }

  revalidatePath("/");
  revalidatePath("/admin");
  // The refreshed panel drops the form (no longer rejected): the toast comes from the flash.
  await setFlash("application-sent");
  return { sent: true };
}
