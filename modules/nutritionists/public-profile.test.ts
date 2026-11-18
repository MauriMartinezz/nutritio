import { test } from "node:test";
import assert from "node:assert/strict";
import { InvalidPublicProfileError, formatFee, parsePublicProfile } from "./public-profile";

const valid = {
  bio: " Sports nutritionist with 10 years of experience. ",
  education: " Universidad de Buenos Aires ",
  planIncludes: " Weekly check-ins and a shopping list ",
  feeAmount: " 25000 ",
  feeCurrency: "ARS",
  feeDescription: " per month ",
};

function problemsOf(input: Record<string, unknown>) {
  try {
    parsePublicProfile(input);
  } catch (error) {
    assert.ok(error instanceof InvalidPublicProfileError);
    return error.problems;
  }
  assert.fail("expected an InvalidPublicProfileError");
}

test("parses and trims a valid public profile", () => {
  assert.deepEqual(parsePublicProfile(valid), {
    bio: "Sports nutritionist with 10 years of experience.",
    education: "Universidad de Buenos Aires",
    planIncludes: "Weekly check-ins and a shopping list",
    feeAmount: "25000.00",
    feeCurrency: "ARS",
    feeDescription: "per month",
  });
});

test("every field is optional and empty strings become null", () => {
  assert.deepEqual(
    parsePublicProfile({ bio: "", education: "  ", planIncludes: "", feeAmount: "", feeDescription: " " }),
    {
      bio: null,
      education: null,
      planIncludes: null,
      feeAmount: null,
      feeCurrency: "ARS",
      feeDescription: null,
    },
  );
  assert.equal(parsePublicProfile({}).bio, null);
});

test("text fields respect their length limits", () => {
  assert.ok(problemsOf({ bio: "a".repeat(1001) }).bio);
  assert.ok(problemsOf({ education: "a".repeat(501) }).education);
  assert.ok(problemsOf({ planIncludes: "a".repeat(1001) }).planIncludes);
  assert.ok(problemsOf({ feeDescription: "a".repeat(201) }).feeDescription);

  const atLimit = parsePublicProfile({
    bio: "a".repeat(1000),
    education: "a".repeat(500),
    planIncludes: "a".repeat(1000),
    feeDescription: "a".repeat(200),
  });
  assert.equal(atLimit.bio?.length, 1000);
  assert.equal(atLimit.education?.length, 500);
  assert.equal(atLimit.planIncludes?.length, 1000);
  assert.equal(atLimit.feeDescription?.length, 200);
});

test("fee amount accepts up to 2 decimals, with a dot or a comma", () => {
  assert.equal(parsePublicProfile({ feeAmount: "15000.5" }).feeAmount, "15000.50");
  assert.equal(parsePublicProfile({ feeAmount: "15000,75" }).feeAmount, "15000.75");
  assert.equal(parsePublicProfile({ feeAmount: "10000000" }).feeAmount, "10000000.00");
  assert.ok(problemsOf({ feeAmount: "10.123" }).feeAmount);
});

test("fee amount must be a positive number up to 10,000,000", () => {
  assert.ok(problemsOf({ feeAmount: "0" }).feeAmount);
  assert.ok(problemsOf({ feeAmount: "-5" }).feeAmount);
  assert.ok(problemsOf({ feeAmount: "abc" }).feeAmount);
  assert.ok(problemsOf({ feeAmount: "1e5" }).feeAmount);
  assert.ok(problemsOf({ feeAmount: "25.000.000" }).feeAmount);
  assert.ok(problemsOf({ feeAmount: "10000000.01" }).feeAmount);
});

test("fee currency is ARS or USD, ARS by default", () => {
  assert.equal(parsePublicProfile({ feeCurrency: "USD" }).feeCurrency, "USD");
  assert.equal(parsePublicProfile({ feeCurrency: "" }).feeCurrency, "ARS");
  assert.ok(problemsOf({ feeCurrency: "EUR" }).feeCurrency);
});

test("reports every invalid field at once", () => {
  const problems = problemsOf({
    bio: "a".repeat(1001),
    education: "a".repeat(501),
    planIncludes: "a".repeat(1001),
    feeAmount: "-1",
    feeCurrency: "EUR",
    feeDescription: "a".repeat(201),
  });
  assert.deepEqual(Object.keys(problems).sort(), [
    "bio",
    "education",
    "feeAmount",
    "feeCurrency",
    "feeDescription",
    "planIncludes",
  ]);
});

test("formats a fee with its currency and description", () => {
  assert.equal(
    formatFee({ feeAmount: "25000.00", feeCurrency: "ARS", feeDescription: "per month" }),
    "ARS 25.000 · per month",
  );
  assert.equal(formatFee({ feeAmount: "49.9", feeCurrency: "USD", feeDescription: null }), "USD 49,90");
  assert.equal(formatFee({ feeAmount: null, feeCurrency: "ARS", feeDescription: "per month" }), null);
});
