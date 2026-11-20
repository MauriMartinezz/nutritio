// Contact requests and admin fixes to user accounts. Pure: unit tested.
import type { Locale } from "@/lib/i18n/negotiate";
import { MAX_NAME_LENGTH, parseDisplayName } from "@/modules/identity/account";
import { supportErrors } from "./messages";

export const SUPPORT_LIMITS = { title: 120, description: 2000, reply: 2000 } as const;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class InvalidSupportInputError extends Error {
  constructor(readonly problems: Record<string, string>) {
    super(`Invalid input: ${Object.values(problems).join("; ")}`);
    this.name = "InvalidSupportInputError";
  }
}

const text = (value: unknown) => (typeof value === "string" ? value.trim() : "");

function fail(problems: Record<string, string>) {
  if (Object.keys(problems).length > 0) throw new InvalidSupportInputError(problems);
}

/** What a user writes on the Contact page. */
export function parseSupportRequest(input: Record<string, unknown>, locale: Locale = "en") {
  const t = supportErrors[locale];
  const title = text(input.title);
  const description = text(input.description);
  const problems: Record<string, string> = {};
  if (!title || title.length > SUPPORT_LIMITS.title) problems.title = t.title(SUPPORT_LIMITS.title);
  if (!description || description.length > SUPPORT_LIMITS.description) {
    problems.description = t.description(SUPPORT_LIMITS.description);
  }
  fail(problems);
  return { title, description };
}

/** An admin's answer; "resolve" also closes the request as completed. */
export function parseSupportReply(input: Record<string, unknown>, locale: Locale = "en") {
  const reply = text(input.reply);
  fail(!reply || reply.length > SUPPORT_LIMITS.reply ? { reply: supportErrors[locale].reply(SUPPORT_LIMITS.reply) } : {});
  return { reply, resolve: input.decision === "resolve" };
}

/** Name and email an admin corrects for a user who asked for help. */
export function parseAdminUserEdit(input: Record<string, unknown>, locale: Locale = "en") {
  const t = supportErrors[locale];
  const problems: Record<string, string> = {};
  let name = "";
  try {
    name = parseDisplayName(input.name);
  } catch {
    problems.name = t.name(MAX_NAME_LENGTH);
  }
  const email = text(input.email).toLowerCase();
  if (!EMAIL.test(email) || email.length > 255) problems.email = t.email;
  fail(problems);
  return { name, email };
}
