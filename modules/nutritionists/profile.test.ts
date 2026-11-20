import { test } from "node:test";
import assert from "node:assert/strict";
import {
  InvalidProfileError,
  buildPhone,
  formatBirthDate,
  formatDni,
  maskDateInput,
  maskDniInput,
  maskPhoneNumberInput,
  maskPhonePrefixInput,
  parseBirthDateInput,
  parseNutritionistProfile,
  splitPhone,
} from "./profile";

const today = new Date("2026-11-13T12:00:00Z");

const valid = {
  dni: " 30123456 ",
  licenseNumber: " MN 1234 ",
  birthDate: "1990-05-20",
  phone: "+54 11 5555 1234",
  specialty: " Sports nutrition ",
};

test("parses and trims a valid nutritionist profile", () => {
  assert.deepEqual(parseNutritionistProfile(valid, today), {
    dni: "30123456",
    licenseNumber: "MN 1234",
    birthDate: new Date("1990-05-20T00:00:00.000Z"),
    phone: "+54 11 5555 1234",
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
    dni: "30.12",
    licenseNumber: "",
    birthDate: "not-a-date",
    phone: "call me",
  });
  assert.deepEqual(Object.keys(problems).sort(), ["birthDate", "dni", "licenseNumber", "phone"]);
});

test("DNI must be between 1.000.000 and 999.999.999", () => {
  assert.ok(problemsOf({ ...valid, dni: "999999" }).dni);
  assert.ok(problemsOf({ ...valid, dni: "0999999" }).dni);
  assert.ok(problemsOf({ ...valid, dni: "1000000000" }).dni);
  assert.equal(parseNutritionistProfile({ ...valid, dni: "1000000" }, today).dni, "1000000");
  assert.equal(parseNutritionistProfile({ ...valid, dni: "999.999.999" }, today).dni, "999999999");
  assert.equal(problemsOf({ ...valid, dni: "999999" }).dni, "DNI must be between 1.000.000 and 999.999.999");
});

test("nutritionists must be between 18 and 100 years old", () => {
  assert.ok(problemsOf({ ...valid, birthDate: "14/11/2008" }).birthDate);
  assert.equal(parseNutritionistProfile({ ...valid, birthDate: "13/11/2008" }, today).birthDate.toISOString().slice(0, 10), "2008-11-13");
  assert.ok(problemsOf({ ...valid, birthDate: "2010-01-01" }).birthDate);
  assert.ok(problemsOf({ ...valid, birthDate: "1900-01-01" }).birthDate);
  assert.ok(problemsOf({ ...valid, birthDate: "2027-01-01" }).birthDate);
});

test("phone sent as one string must be prefix + number, as the sign-up form builds it", () => {
  assert.equal(parseNutritionistProfile({ ...valid, phone: "+54 351 1234 567" }, today).phone, "+54 351 1234 567");
  assert.ok(problemsOf({ ...valid, phone: "1155551234" }).phone);
  assert.ok(problemsOf({ ...valid, phone: "+54 11 5555-1234" }).phone);
});

test("phone can arrive in two parts, prefix and number (admin form)", () => {
  const parts = { ...valid, phone: undefined, phonePrefix: " +54  11 ", phoneNumber: "55551234" };
  assert.equal(parseNutritionistProfile(parts, today).phone, "+54 11 5555 1234");
  assert.ok(problemsOf({ ...parts, phonePrefix: "54 11" }).phone);
  assert.ok(problemsOf({ ...parts, phoneNumber: "12345" }).phone);
});

test("buildPhone validates each part and groups the number every 4 digits", () => {
  assert.deepEqual(buildPhone("+54 11", "5555 1234"), { phone: "+54 11 5555 1234" });
  assert.deepEqual(buildPhone("+54 351", "1234567"), { phone: "+54 351 1234 567" });
  assert.deepEqual(buildPhone("", "55551234"), { error: "Phone prefix must look like +54 11" });
  assert.deepEqual(buildPhone("+54 11", "123"), { error: "Phone number must have 6 to 8 digits" });
  assert.deepEqual(buildPhone("+54 11", "5555-1234"), { phone: "+54 11 5555 1234" });
});

test("splitPhone separates a stored phone into its two parts", () => {
  assert.deepEqual(splitPhone("+54 11 5555 1234"), { prefix: "+54 11", number: "5555 1234" });
  assert.deepEqual(splitPhone("(011) 4555-1234"), { prefix: "", number: "(011) 4555-1234" });
  assert.deepEqual(splitPhone(null), { prefix: "", number: "" });
});

test("DNI accepts dots between thousands and is stored as digits", () => {
  assert.equal(parseNutritionistProfile({ ...valid, dni: "30.123.456" }, today).dni, "30123456");
  assert.equal(parseNutritionistProfile({ ...valid, dni: "1.234.567" }, today).dni, "1234567");
  assert.equal(formatDni("30123456"), "30.123.456");
  assert.equal(formatDni("1234567"), "1.234.567");
  assert.equal(formatDni("999999999"), "999.999.999");
});

test("birth date accepts dd/mm/yyyy", () => {
  const profile = parseNutritionistProfile({ ...valid, birthDate: "20/05/1990" }, today);
  assert.deepEqual(profile.birthDate, new Date("1990-05-20T00:00:00.000Z"));
  assert.ok(problemsOf({ ...valid, birthDate: "31/02/1990" }).birthDate);
  assert.deepEqual(parseBirthDateInput("20/05/1990"), new Date("1990-05-20T00:00:00.000Z"));
  assert.equal(parseBirthDateInput("2/5/90"), null);
  assert.equal(formatBirthDate(new Date("1990-05-20T00:00:00.000Z")), "20/05/1990");
});

test("input masks format while typing", () => {
  assert.equal(maskDniInput("30123456"), "30.123.456");
  assert.equal(maskDniInput("3012"), "3.012");
  assert.equal(maskDniInput("30.1234567x9"), "301.234.567");
  assert.equal(maskDniInput("9999999999"), "999.999.999");
  assert.equal(maskDateInput("2005"), "20/05");
  assert.equal(maskDateInput("20051990"), "20/05/1990");
  assert.equal(maskDateInput("20/05/19901"), "20/05/1990");
  assert.equal(maskPhonePrefixInput("5411"), "+5411");
  assert.equal(maskPhonePrefixInput("+54 11a"), "+54 11");
  assert.equal(maskPhoneNumberInput("55551234"), "5555 1234");
  assert.equal(maskPhoneNumberInput("555512349"), "5555 1234");
  assert.equal(maskPhoneNumberInput("5555"), "5555");
});

test("accepts the full ISO string the sign-up client sends for a birth date", () => {
  const profile = parseNutritionistProfile({ ...valid, birthDate: "1990-05-20T00:00:00.000Z" }, today);
  assert.deepEqual(profile.birthDate, new Date("1990-05-20T00:00:00.000Z"));
  assert.ok(problemsOf({ ...valid, birthDate: "1990-05-20T15:30:00.000Z" }).birthDate);
});

test("profile errors can be reported in Spanish", () => {
  try {
    parseNutritionistProfile({ ...valid, dni: "999999" }, today, "es");
    assert.fail("expected an InvalidProfileError");
  } catch (error) {
    assert.ok(error instanceof InvalidProfileError);
    assert.equal(error.problems.dni, "El DNI tiene que estar entre 1.000.000 y 999.999.999");
  }
  assert.deepEqual(buildPhone("+54 11", "123", "es"), { error: "El número tiene que tener entre 6 y 8 dígitos" });
});
