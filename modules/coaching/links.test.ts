import { test } from "node:test";
import assert from "node:assert/strict";
import {
  LinkRuleError,
  canAccessClient,
  decideLinkRequest,
  respondToLinkRequest,
} from "./links";

const approvedNutritionist = { role: "NUTRITIONIST", nutritionistStatus: "APPROVED" } as const;

test("a client can request to work with an approved nutritionist", () => {
  assert.equal(decideLinkRequest(approvedNutritionist, null), "CREATE");
});

test("a client cannot request a nutritionist that is not approved", () => {
  for (const nutritionistStatus of ["PENDING", "REJECTED"] as const) {
    assert.throws(
      () => decideLinkRequest({ role: "NUTRITIONIST", nutritionistStatus }, null),
      LinkRuleError,
    );
  }
  assert.throws(
    () => decideLinkRequest({ role: "CLIENT", nutritionistStatus: null }, null),
    LinkRuleError,
  );
});

test("a client cannot duplicate a pending or accepted request", () => {
  assert.throws(
    () => decideLinkRequest(approvedNutritionist, { status: "PENDING" }),
    LinkRuleError,
  );
  assert.throws(
    () => decideLinkRequest(approvedNutritionist, { status: "ACCEPTED" }),
    LinkRuleError,
  );
});

test("a client may request again after a rejection", () => {
  assert.equal(decideLinkRequest(approvedNutritionist, { status: "REJECTED" }), "REOPEN");
});

test("a nutritionist accepts or rejects a pending request", () => {
  assert.equal(respondToLinkRequest("APPROVED", { status: "PENDING" }, "ACCEPT"), "ACCEPTED");
  assert.equal(respondToLinkRequest("APPROVED", { status: "PENDING" }, "REJECT"), "REJECTED");
});

test("a nutritionist who is not approved cannot answer requests", () => {
  for (const status of ["PENDING", "REJECTED"] as const) {
    assert.throws(() => respondToLinkRequest(status, { status: "PENDING" }, "ACCEPT"), LinkRuleError);
  }
});

test("only pending requests can be answered", () => {
  assert.throws(() => respondToLinkRequest("APPROVED", { status: "ACCEPTED" }, "REJECT"), LinkRuleError);
  assert.throws(() => respondToLinkRequest("APPROVED", { status: "REJECTED" }, "ACCEPT"), LinkRuleError);
});

test("a nutritionist accesses client data only through an accepted link", () => {
  assert.equal(canAccessClient("APPROVED", { status: "ACCEPTED" }), true);
  assert.equal(canAccessClient("APPROVED", { status: "PENDING" }), false);
  assert.equal(canAccessClient("APPROVED", { status: "REJECTED" }), false);
  assert.equal(canAccessClient("APPROVED", null), false);
});

test("a revoked or unverified nutritionist loses access but keeps the link", () => {
  for (const status of ["PENDING", "REJECTED", null] as const) {
    assert.equal(canAccessClient(status, { status: "ACCEPTED" }), false);
  }
});
