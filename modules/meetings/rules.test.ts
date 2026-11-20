import { test } from "node:test";
import assert from "node:assert/strict";
import {
  InvalidMeetingRequestError,
  MEETING_LIMITS,
  MeetingRuleError,
  ensureCanRequestMeeting,
  meetingKindLabel,
  meetingStatusLabel,
  parseDateTimeLocal,
  parseMeetingRequest,
  parseMeetingResponse,
  pendingActionCount,
  pendingActionsLabel,
  toDateTimeLocalValue,
} from "./rules";

// Friday 13 November 2026, afternoon (server local time).
const now = new Date(2026, 10, 13, 15, 30);

test("a meeting request has a kind and optional message and preferred times", () => {
  assert.deepEqual(
    parseMeetingRequest({ kind: "VIDEO_CALL", message: "  About my plan  ", preferredTimes: " weekday evenings " }),
    { kind: "VIDEO_CALL", message: "About my plan", preferredTimes: "weekday evenings" },
  );
  assert.deepEqual(parseMeetingRequest({ kind: "IN_PERSON", message: "", preferredTimes: "" }), {
    kind: "IN_PERSON",
    message: null,
    preferredTimes: null,
  });
});

test("a meeting request rejects an unknown kind and texts that are too long, all at once", () => {
  assert.throws(
    () =>
      parseMeetingRequest({
        kind: "PHONE",
        message: "x".repeat(MEETING_LIMITS.message + 1),
        preferredTimes: "x".repeat(MEETING_LIMITS.preferredTimes + 1),
      }),
    (error: unknown) =>
      error instanceof InvalidMeetingRequestError &&
      Object.keys(error.problems).sort().join() === "kind,message,preferredTimes",
  );
  assert.doesNotThrow(() =>
    parseMeetingRequest({
      kind: "VIDEO_CALL",
      message: "x".repeat(MEETING_LIMITS.message),
      preferredTimes: "x".repeat(MEETING_LIMITS.preferredTimes),
    }),
  );
});

test("a client may have only one pending request per nutritionist", () => {
  assert.doesNotThrow(() => ensureCanRequestMeeting(0));
  assert.throws(() => ensureCanRequestMeeting(1), MeetingRuleError);
});

test("datetime-local values are read in local time", () => {
  assert.deepEqual(parseDateTimeLocal("2026-11-20T18:30"), new Date(2026, 10, 20, 18, 30));
  assert.deepEqual(parseDateTimeLocal("2026-11-20T18:30:15"), new Date(2026, 10, 20, 18, 30, 15));
  assert.equal(parseDateTimeLocal("2026-02-30T10:00"), null);
  assert.equal(parseDateTimeLocal("2026-11-20"), null);
  assert.equal(parseDateTimeLocal("tomorrow"), null);
  assert.equal(parseDateTimeLocal(undefined), null);
  assert.equal(toDateTimeLocalValue(new Date(2026, 0, 5, 9, 7)), "2026-01-05T09:07");
});

test("accepting a meeting requires a future date; the note is optional", () => {
  assert.deepEqual(
    parseMeetingResponse({ decision: "accept", scheduledFor: "2026-11-20T18:30", responseNote: "  Zoom link by email " }, now),
    { status: "ACCEPTED", scheduledFor: new Date(2026, 10, 20, 18, 30), responseNote: "Zoom link by email" },
  );
  assert.throws(() => parseMeetingResponse({ decision: "accept", scheduledFor: "" }, now), MeetingRuleError);
  assert.throws(() => parseMeetingResponse({ decision: "accept", scheduledFor: "soon" }, now), MeetingRuleError);
  assert.throws(
    () => parseMeetingResponse({ decision: "accept", scheduledFor: "2026-11-13T15:30" }, now),
    MeetingRuleError,
  );
  assert.throws(
    () => parseMeetingResponse({ decision: "accept", scheduledFor: "2026-11-12T10:00" }, now),
    MeetingRuleError,
  );
});

test("declining a meeting needs nothing else and ignores a date", () => {
  assert.deepEqual(parseMeetingResponse({ decision: "decline", scheduledFor: "garbage" }, now), {
    status: "DECLINED",
    scheduledFor: null,
    responseNote: null,
  });
  assert.deepEqual(parseMeetingResponse({ decision: "decline", responseNote: " Fully booked " }, now), {
    status: "DECLINED",
    scheduledFor: null,
    responseNote: "Fully booked",
  });
});

test("the response note has at most 500 characters and the decision must be known", () => {
  const note = "x".repeat(MEETING_LIMITS.responseNote);
  assert.equal(parseMeetingResponse({ decision: "decline", responseNote: note }, now).responseNote, note);
  assert.throws(
    () => parseMeetingResponse({ decision: "decline", responseNote: `${note}x` }, now),
    MeetingRuleError,
  );
  assert.throws(() => parseMeetingResponse({ decision: "maybe" }, now), MeetingRuleError);
});

test("pending actions are pending link requests plus pending meeting requests", () => {
  assert.equal(pendingActionCount({ pendingLinkRequests: 0, pendingMeetingRequests: 0 }), 0);
  assert.equal(pendingActionCount({ pendingLinkRequests: 2, pendingMeetingRequests: 1 }), 3);
  assert.equal(pendingActionsLabel(1), "1 pending action");
  assert.equal(pendingActionsLabel(3), "3 pending actions");
});

test("kinds and statuses have readable labels", () => {
  assert.equal(meetingKindLabel("VIDEO_CALL"), "Video call");
  assert.equal(meetingKindLabel("IN_PERSON"), "In-person visit");
  assert.equal(meetingStatusLabel("PENDING"), "Waiting for an answer");
  assert.equal(meetingStatusLabel("ACCEPTED"), "Accepted");
  assert.equal(meetingStatusLabel("DECLINED"), "Declined");
});

test("in Spanish, labels and errors read in Spanish", () => {
  assert.equal(meetingKindLabel("VIDEO_CALL", "es"), "Videollamada");
  assert.equal(meetingStatusLabel("PENDING", "es"), "Esperando respuesta");
  assert.equal(pendingActionsLabel(1, "es"), "1 acción pendiente");
  assert.equal(pendingActionsLabel(3, "es"), "3 acciones pendientes");
  assert.throws(
    () => parseMeetingRequest({ kind: "PHONE" }, "es"),
    (error: unknown) =>
      error instanceof InvalidMeetingRequestError && error.problems.kind === "Elegí videollamada o reunión presencial",
  );
  assert.throws(() => ensureCanRequestMeeting(1, "es"), {
    message: "Ya tenés un pedido de reunión pendiente con este nutricionista",
  });
  assert.throws(() => parseMeetingResponse({ decision: "accept", scheduledFor: "" }, new Date(), "es"), {
    message: "Elegí fecha y hora para la reunión",
  });
});
