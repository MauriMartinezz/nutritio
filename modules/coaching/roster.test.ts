import { test } from "node:test";
import assert from "node:assert/strict";
import { AccessRuleError } from "./access";
import {
  matchesFilter,
  parsePeriodChoice,
  parseRosterFilter,
  rosterStatus,
  sortRoster,
  timeLeftLabel,
  type RosterRow,
} from "./roster";
import { parseAutoRenew, parseRosterDialog, renewReturnHref, rosterHref } from "./roster";

const now = new Date("2026-06-01T12:00:00Z");
const day = 24 * 60 * 60 * 1000;
const at = (days: number) => new Date(now.getTime() + days * day);
const access = (until: Date | null, autoRenew = false) => ({ accessUntil: until, autoRenew, amount: 1, unit: "MONTH" as const });

test("roster status: pending and rejected links, then the access state", () => {
  assert.equal(rosterStatus({ status: "PENDING", ...access(null) }, now), "PENDING");
  assert.equal(rosterStatus({ status: "REJECTED", ...access(null) }, now), "REJECTED");
  assert.equal(rosterStatus({ status: "ACCEPTED", ...access(at(30)) }, now), "ACTIVE");
  assert.equal(rosterStatus({ status: "ACCEPTED", ...access(at(3)) }, now), "EXPIRING");
  assert.equal(rosterStatus({ status: "ACCEPTED", ...access(at(-2)) }, now), "EXPIRED");
});

test("time left reads in days, weeks or months, and expired access reads as ago", () => {
  assert.equal(timeLeftLabel(at(0.5), now), "Less than a day left");
  assert.equal(timeLeftLabel(at(1), now), "1 day left");
  assert.equal(timeLeftLabel(at(12), now), "12 days left");
  assert.equal(timeLeftLabel(at(21), now), "3 weeks left");
  assert.equal(timeLeftLabel(at(95), now), "3 months left");
  assert.equal(timeLeftLabel(at(400), now), "13 months left");
  assert.equal(timeLeftLabel(at(-0.2), now), "Ended today");
  assert.equal(timeLeftLabel(at(-4), now), "Ended 4 days ago");
  assert.equal(timeLeftLabel(null, now), "—");
});

test("quick renew presets map to periods; custom and legacy forms use amount + unit", () => {
  assert.deepEqual(parsePeriodChoice({ preset: "1M" }), { amount: 1, unit: "MONTH" });
  assert.deepEqual(parsePeriodChoice({ preset: "3M" }), { amount: 3, unit: "MONTH" });
  assert.deepEqual(parsePeriodChoice({ preset: "6M" }), { amount: 6, unit: "MONTH" });
  assert.deepEqual(parsePeriodChoice({ preset: "1Y" }), { amount: 12, unit: "MONTH" });
  assert.deepEqual(parsePeriodChoice({ preset: "custom", amount: "10", unit: "DAY" }), { amount: 10, unit: "DAY" });
  assert.deepEqual(parsePeriodChoice({ amount: "2", unit: "WEEK" }), { amount: 2, unit: "WEEK" });
  assert.throws(() => parsePeriodChoice({ preset: "2Y" }), AccessRuleError);
  assert.throws(() => parsePeriodChoice({ preset: "custom", amount: "0", unit: "DAY" }), AccessRuleError);
});

const row = (status: RosterRow["status"], needsAction: boolean, until: Date | null = null): RosterRow => ({
  status,
  needsAction,
  until,
});

test("filters: unknown values fall back to all; each filter keeps its rows", () => {
  assert.equal(parseRosterFilter(undefined), "all");
  assert.equal(parseRosterFilter("bogus"), "all");
  assert.equal(parseRosterFilter("expiring"), "expiring");
  const active = row("ACTIVE", false, at(30));
  const pending = row("PENDING", true);
  assert.ok(matchesFilter(active, "all") && matchesFilter(pending, "all"));
  assert.ok(matchesFilter(pending, "needs-action") && !matchesFilter(active, "needs-action"));
  assert.ok(matchesFilter(active, "active") && !matchesFilter(active, "expired"));
  assert.ok(matchesFilter(row("REJECTED", false), "rejected"));
});

test("sorting: needs action first, then pending, expiring, expired, active by end date, rejected last", () => {
  const rows = [
    row("REJECTED", false),
    row("ACTIVE", false, at(90)),
    row("ACTIVE", false, at(20)),
    row("EXPIRED", false, at(-3)),
    row("EXPIRING", false, at(2)),
    row("PENDING", true),
    row("ACTIVE", true, at(60)),
  ];
  assert.deepEqual(
    sortRoster(rows).map((r) => `${r.status}${r.needsAction ? "!" : ""}`),
    ["PENDING!", "ACTIVE!", "EXPIRING", "EXPIRED", "ACTIVE", "ACTIVE", "REJECTED"],
  );
  assert.deepEqual(sortRoster(rows).filter((r) => r.status === "ACTIVE" && !r.needsAction).map((r) => r.until), [at(20), at(90)]);
});

test("rosterHref keeps the filter (except all) and adds one dialog", () => {
  assert.equal(rosterHref("all"), "/clients");
  assert.equal(rosterHref("expiring"), "/clients?filter=expiring");
  assert.equal(rosterHref("all", { renew: "l1" }), "/clients?renew=l1");
  assert.equal(rosterHref("pending", { accept: "l2" }), "/clients?filter=pending&accept=l2");
  assert.equal(rosterHref("needs-action", { meeting: "m 1" }), "/clients?filter=needs-action&meeting=m+1");
});

test("parseRosterDialog reads one dialog from the URL; unknown or empty ids open nothing", () => {
  assert.deepEqual(parseRosterDialog({ renew: "l1" }), { kind: "renew", id: "l1" });
  assert.deepEqual(parseRosterDialog({ accept: "l2" }), { kind: "accept", id: "l2" });
  assert.deepEqual(parseRosterDialog({ meeting: "m1" }), { kind: "meeting", id: "m1" });
  assert.deepEqual(parseRosterDialog({ renew: ["l1", "l9"] }), { kind: "renew", id: "l1" });
  assert.equal(parseRosterDialog({}), null);
  assert.equal(parseRosterDialog({ renew: "" }), null);
  assert.equal(parseRosterDialog({ filter: "all" }), null);
});

test("time left and period errors read in Spanish", () => {
  assert.equal(timeLeftLabel(at(0.5), now, "es"), "Queda menos de un día");
  assert.equal(timeLeftLabel(at(1), now, "es"), "Queda 1 día");
  assert.equal(timeLeftLabel(at(12), now, "es"), "Quedan 12 días");
  assert.equal(timeLeftLabel(at(21), now, "es"), "Quedan 3 semanas");
  assert.equal(timeLeftLabel(at(95), now, "es"), "Quedan 3 meses");
  assert.equal(timeLeftLabel(at(-0.2), now, "es"), "Terminó hoy");
  assert.equal(timeLeftLabel(at(-4), now, "es"), "Terminó hace 4 días");
  assert.throws(() => parsePeriodChoice({ preset: "2Y" }, "es"), { message: "Elegí un período de renovación" });
});

test("auto-renew off ignores the period; on requires a valid one", () => {
  assert.deepEqual(parseAutoRenew({ amount: "2", unit: "WEEK" }), { autoRenew: false });
  assert.deepEqual(parseAutoRenew({ autoRenew: null, amount: "0", unit: "YEAR" }), { autoRenew: false });
  assert.deepEqual(parseAutoRenew({ autoRenew: "on", amount: "2", unit: "WEEK" }), {
    autoRenew: true,
    period: { amount: 2, unit: "WEEK" },
  });
  assert.throws(() => parseAutoRenew({ autoRenew: "on", amount: "0", unit: "DAY" }), AccessRuleError);
  assert.throws(() => parseAutoRenew({ autoRenew: "on", amount: "0", unit: "DAY" }, "es"), {
    message: "La cantidad debe ser un número entero entre 1 y 365",
  });
});

test("after renewing, go back to the client's page or to the clients table, never to a browser-given URL", () => {
  assert.equal(renewReturnHref({ returnTo: "client" }, "c1"), "/clients/c1");
  assert.equal(renewReturnHref({ returnTo: "client" }, "c/../x"), "/clients/c%2F..%2Fx");
  assert.equal(renewReturnHref({ filter: "expiring" }, "c1"), "/clients?filter=expiring");
  assert.equal(renewReturnHref({ returnTo: "https://evil.example", filter: "bogus" }, "c1"), "/clients");
  assert.equal(renewReturnHref({}, "c1"), "/clients");
});
