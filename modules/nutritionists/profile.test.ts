import { test } from "node:test";
import assert from "node:assert/strict";
import { InvalidProfileError, parseNutritionistProfile } from "./profile";

const today = new Date("2026-11-13T12:00:00Z");

const valid = {
  dni: " 30123456 ",
  licenseNumber: " MN 1234 ",
  birthDate: "1990-05-20",
  phone: "+54 11 5555-1234",
  specialty: " Sports nutrition ",
};

test("parses and trims a valid nutritionist profile", () => {
  assert.deepEqual(parseNutritionistProfile(valid, today), {
    dni: "30123456",
    licenseNumber: "MN 1234",
    birthDate: new Date("1990-05-20T00:00:00.000Z"),
    phone: "+54 11 5555-1234",
    specialty: "Sports nutrition",
  });
});

test("specialty is optional", () => {
  const profile = parseNutritionistProfile({ ...valid, specialty: "  " }, today);
  assert.equal(profile.specialty, null);
});

test("accepts a Date as birth date", () => {
  const profile = parseNutritionistProfile(
    { ...valid, birthDate: new Date("1990-05-20T00:00:00.000Z") },
    today,
  );
  assert.deepEqual(profile.birthDate, new Date("1990-05-20T00:00:00.000Z"));
});

function problemsOf(input: Record<string, unknown>) {
  try {
    parseNutritionistProfile(input, today);
  } catch (error) {
    assert.ok(error instanceof InvalidProfileError);
    return error.problems;
  }
  assert.fail("expected an InvalidProfileError");
}

test("reports every invalid field at once", () => {
  const problems = problemsOf({
    dni: "30.123.456",
    licenseNumber: "",
    birthDate: "not-a-date",
    phone: "call me",
  });
  assert.deepEqual(Object.keys(problems).sort(), ["birthDate", "dni", "licenseNumber", "phone"]);
});

test("DNI must have 7 or 8 digits", () => {
  assert.ok(problemsOf({ ...valid, dni: "123456" }).dni);
  assert.ok(problemsOf({ ...valid, dni: "123456789" }).dni);
  assert.equal(parseNutritionistProfile({ ...valid, dni: "1234567" }, today).dni, "1234567");
});

test("nutritionists must be between 18 and 100 years old", () => {
  assert.ok(problemsOf({ ...valid, birthDate: "2010-01-01" }).birthDate);
  assert.ok(problemsOf({ ...valid, birthDate: "1900-01-01" }).birthDate);
  assert.ok(problemsOf({ ...valid, birthDate: "2027-01-01" }).birthDate);
});

test("phone accepts 6 to 20 digits, spaces, +, - and parentheses", () => {
  assert.ok(problemsOf({ ...valid, phone: "12345" }).phone);
  assert.equal(parseNutritionistProfile({ ...valid, phone: "(011) 4555-1234" }, today).phone, "(011) 4555-1234");
});
