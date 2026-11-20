"use server";

import { revalidatePath } from "next/cache";
import { getActionLocale } from "@/lib/i18n/server";
import { prisma } from "@/lib/prisma";
import { uniqueViolationIndex } from "@/lib/prisma-errors";
import { requireRole, requireUser } from "@/modules/identity/dal";
import { supportErrors } from "./messages";
import { InvalidSupportInputError, parseAdminUserEdit, parseSupportReply, parseSupportRequest } from "./support";

export type SupportFormState = {
  problems?: Record<string, string>;
  /** What was sent, so a rejected form shows it again after React resets the fields. */
  values?: Record<string, string>;
  saved?: "sent" | "replied" | "resolved" | "user";
};

const sentValues = (formData: FormData, fields: string[]) =>
  Object.fromEntries(fields.map((field) => [field, String(formData.get(field) ?? "")]));

/** Any signed-in user sends a request from the Contact page (used with useActionState). */
export async function sendSupportRequest(_previous: SupportFormState, formData: FormData): Promise<SupportFormState> {
  const user = await requireUser();
  let data;
  try {
    data = parseSupportRequest(Object.fromEntries(formData), await getActionLocale());
  } catch (error) {
    if (error instanceof InvalidSupportInputError) {
      return { problems: error.problems, values: sentValues(formData, ["title", "description"]) };
    }
    throw error;
  }
  // The author is always the caller; nothing about it comes from the browser.
  await prisma.supportRequest.create({ data: { ...data, userId: user.id } });
  revalidatePath("/contact");
  revalidatePath("/admin/requests");
  return { saved: "sent" };
}

/** An admin answers a request and optionally closes it as completed. */
export async function answerSupportRequest(_previous: SupportFormState, formData: FormData): Promise<SupportFormState> {
  const admin = await requireRole("ADMIN");
  const locale = await getActionLocale();
  const requestId = String(formData.get("requestId") ?? "");
  let answer;
  try {
    answer = parseSupportReply(Object.fromEntries(formData), locale);
  } catch (error) {
    if (error instanceof InvalidSupportInputError) return { problems: error.problems, values: sentValues(formData, ["reply"]) };
    throw error;
  }

  const now = new Date();
  const { count } = await prisma.supportRequest.updateMany({
    where: { id: requestId },
    data: {
      reply: answer.reply,
      repliedById: admin.id,
      repliedAt: now,
      ...(answer.resolve && { status: "RESOLVED", resolvedAt: now }),
    },
  });
  if (count === 0) return { problems: { form: supportErrors[locale].notFound } };

  revalidatePath("/admin/requests");
  revalidatePath("/contact");
  return { saved: answer.resolve ? "resolved" : "replied" };
}

/** An admin fixes a user's name or email (e.g. after a Contact request). */
export async function updateUserByAdmin(_previous: SupportFormState, formData: FormData): Promise<SupportFormState> {
  await requireRole("ADMIN");
  const locale = await getActionLocale();
  const userId = String(formData.get("userId") ?? "");
  let edit;
  try {
    edit = parseAdminUserEdit(Object.fromEntries(formData), locale);
  } catch (error) {
    if (error instanceof InvalidSupportInputError) {
      return { problems: error.problems, values: sentValues(formData, ["name", "email"]) };
    }
    throw error;
  }

  const target = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
  if (!target) return { problems: { form: supportErrors[locale].notFound } };
  const emailChanged = edit.email !== target.email.toLowerCase();

  try {
    await prisma.user.update({
      where: { id: userId },
      // A new login email has not been verified by its owner.
      data: { ...edit, ...(emailChanged && { emailVerified: false }) },
    });
  } catch (error) {
    if (uniqueViolationIndex(error) !== null) {
      return { problems: { email: supportErrors[locale].emailTaken }, values: sentValues(formData, ["name", "email"]) };
    }
    throw error;
  }

  revalidatePath("/admin/users");
  return { saved: "user" };
}
