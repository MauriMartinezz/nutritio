import { test } from "node:test";
import assert from "node:assert/strict";
import { navSections } from "./nav";

const client = { role: "CLIENT", nutritionistStatus: null } as const;

test("a client who never had a nutritionist only sees what works without one", () => {
  assert.deepEqual(navSections(client, { hadNutritionist: false }), ["home", "activities", "findNutritionist", "contact"]);
});

test("a client who has or had a nutritionist sees plans, check-ins and meetings", () => {
  assert.deepEqual(navSections(client, { hadNutritionist: true }), [
    "home",
    "myPlans",
    "checkIns",
    "activities",
    "meetings",
    "findNutritionist",
    "contact",
  ]);
});

test("nutritionists and admins keep their sections", () => {
  assert.deepEqual(navSections({ role: "NUTRITIONIST", nutritionistStatus: "APPROVED" }, { hadNutritionist: false }), [
    "home",
    "myClients",
    "planTemplates",
    "contact",
  ]);
  assert.deepEqual(navSections({ role: "NUTRITIONIST", nutritionistStatus: "PENDING" }, { hadNutritionist: false }), [
    "home",
    "contact",
  ]);
  assert.deepEqual(navSections({ role: "ADMIN", nutritionistStatus: null }, { hadNutritionist: false }), [
    "home",
    "nutritionists",
    "users",
    "requests",
  ]);
});
