"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/modules/identity/dal";
import {
  InvalidClientPreferencesError,
  InvalidSexError,
  parseClientPreferences,
  parseSex,
} from "./preferences";

export type SaveClientPreferencesState = {
  problems?: Record<string, string>;
  saved?: boolean;
};

/** The signed-in client saves their own preferences (used with useActionState). */
export async function saveClientPreferences(
  _previous: SaveClientPreferencesState,
  formData: FormData,
): Promise<SaveClientPreferencesState> {
  const client = await requireRole("CLIENT");

  let preferences;
  try {
    preferences = parseClientPreferences(Object.fromEntries(formData));
  } catch (error) {
    if (error instanceof InvalidClientPreferencesError) return { problems: error.problems };
    throw error;
  }

  // Only the caller's own row; the id never comes from the browser.
  await prisma.clientPreferences.upsert({
    where: { userId: client.id },
    create: { userId: client.id, ...preferences },
    update: preferences,
  });

  revalidatePath("/profile");
  return { saved: true };
}

/** The signed-in client saves their sex from the account card. Returns an error message, if any. */
export async function saveOwnSex(input: string): Promise<{ error?: string }> {
  const client = await requireRole("CLIENT");

  let sex;
  try {
    sex = parseSex(input);
  } catch (error) {
    if (error instanceof InvalidSexError) return { error: error.message };
    throw error;
  }

  await prisma.clientPreferences.upsert({
    where: { userId: client.id },
    create: { userId: client.id, sex },
    update: { sex },
  });

  revalidatePath("/profile");
  return {};
}
