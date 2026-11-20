// Meeting requests: a client asks one of their nutritionists for a video call
// or an in-person visit; the nutritionist accepts it with a date or declines it.
import type { Locale } from "@/lib/i18n/negotiate";
import { meetingTerms } from "./messages";

export const MEETING_KINDS = ["VIDEO_CALL", "IN_PERSON"] as const;
export type MeetingKind = (typeof MEETING_KINDS)[number];
export type MeetingStatus = "PENDING" | "ACCEPTED" | "DECLINED";

export const MEETING_LIMITS = {
  message: 1000,
  preferredTimes: 300,
  responseNote: 500,
} as const;

export const meetingKindLabel = (kind: MeetingKind, locale: Locale = "en") => meetingTerms[locale].kinds[kind];
export const meetingStatusLabel = (status: MeetingStatus, locale: Locale = "en") => meetingTerms[locale].statuses[status];

export type MeetingRequestInput = {
  kind: MeetingKind;
  message: string | null;
  preferredTimes: string | null;
};
export type MeetingRequestField = keyof MeetingRequestInput;

export class InvalidMeetingRequestError extends Error {
  constructor(readonly problems: Partial<Record<MeetingRequestField, string>>) {
    super(`Invalid meeting request: ${Object.values(problems).join("; ")}`);
    this.name = "InvalidMeetingRequestError";
  }
}

export class MeetingRuleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MeetingRuleError";
  }
}

const text = (value: unknown) => (typeof value === "string" ? value.trim() : "");

/** Validates the client's request form, reporting every invalid field at once. */
export function parseMeetingRequest(input: Record<string, unknown>, locale: Locale = "en"): MeetingRequestInput {
  const t = meetingTerms[locale].errors;
  const problems: Partial<Record<MeetingRequestField, string>> = {};

  const kind = input.kind;
  if (!(MEETING_KINDS as readonly unknown[]).includes(kind)) {
    problems.kind = t.kind;
  }
  const message = text(input.message);
  if (message.length > MEETING_LIMITS.message) {
    problems.message = t.message(MEETING_LIMITS.message);
  }
  const preferredTimes = text(input.preferredTimes);
  if (preferredTimes.length > MEETING_LIMITS.preferredTimes) {
    problems.preferredTimes = t.preferredTimes(MEETING_LIMITS.preferredTimes);
  }

  if (Object.keys(problems).length > 0) throw new InvalidMeetingRequestError(problems);
  return { kind: kind as MeetingKind, message: message || null, preferredTimes: preferredTimes || null };
}

/** At most one pending request per client and nutritionist. */
export function ensureCanRequestMeeting(pendingWithThisNutritionist: number, locale: Locale = "en"): void {
  if (pendingWithThisNutritionist > 0) {
    throw new MeetingRuleError(meetingTerms[locale].errors.alreadyPending);
  }
}

const DATETIME_LOCAL = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/;

/**
 * Reads an `<input type="datetime-local">` value. Those values carry no time
 * zone, so they are interpreted in the server's local time. Null if invalid.
 */
export function parseDateTimeLocal(value: unknown): Date | null {
  const match = DATETIME_LOCAL.exec(text(value));
  if (!match) return null;
  const [year, month, day, hours, minutes, seconds] = match.slice(1).map((part) => Number(part ?? 0));
  const date = new Date(year, month - 1, day, hours, minutes, seconds);
  const roundTrips =
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day &&
    date.getHours() === hours &&
    date.getMinutes() === minutes;
  return roundTrips ? date : null;
}

const pad = (n: number) => String(n).padStart(2, "0");

/** A date as a datetime-local value (server local time), e.g. for the `min` attribute. */
export function toDateTimeLocalValue(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export type MeetingResponse =
  | { status: "ACCEPTED"; scheduledFor: Date; responseNote: string | null }
  | { status: "DECLINED"; scheduledFor: null; responseNote: string | null };

/** The nutritionist's answer: accept with a future date, or decline. The note is optional. */
export function parseMeetingResponse(input: Record<string, unknown>, now: Date, locale: Locale = "en"): MeetingResponse {
  const t = meetingTerms[locale].errors;
  const responseNote = text(input.responseNote);
  if (responseNote.length > MEETING_LIMITS.responseNote) {
    throw new MeetingRuleError(t.responseNote(MEETING_LIMITS.responseNote));
  }
  const note = responseNote || null;

  if (input.decision === "decline") return { status: "DECLINED", scheduledFor: null, responseNote: note };
  if (input.decision !== "accept") throw new MeetingRuleError(t.decision);

  const scheduledFor = parseDateTimeLocal(input.scheduledFor);
  if (!scheduledFor) throw new MeetingRuleError(t.scheduledFor);
  if (scheduledFor <= now) throw new MeetingRuleError(t.past);
  return { status: "ACCEPTED", scheduledFor, responseNote: note };
}

export type PendingActions = { pendingLinkRequests: number; pendingMeetingRequests: number };

/** What the nutritionist must act on: link requests plus meeting requests. */
export const pendingActionCount = ({ pendingLinkRequests, pendingMeetingRequests }: PendingActions) =>
  pendingLinkRequests + pendingMeetingRequests;

/** Accessible label of the badge, e.g. "3 pending actions". */
export const pendingActionsLabel = (count: number, locale: Locale = "en") => meetingTerms[locale].pendingActions(count);
