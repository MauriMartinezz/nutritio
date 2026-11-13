# Feature: auth-roles

Objective: user accounts with roles (ADMIN, NUTRITIONIST, CLIENT), admin-verified nutritionists, and client → nutritionist work requests.
Branch: `feat/auth-roles` · Delivery: `ask-on-risk` · Test runner: `pnpm test` (node:test via tsx) + manual HTTP checks against the dev server.

## Specs

- **S1** — Open registration with Better Auth (email + password). User words: "Registro libre", "Vamos con better auth".
  - Assumption: at sign-up the user chooses CLIENT or NUTRITIONIST. ADMIN can never be self-assigned, and no user can change their own role through the auth API.
- **S2** — Three roles: ADMIN, NUTRITIONIST, CLIENT. User words: "Me parece bien lo del administrador".
- **S3** — Nutritionists start pending; only an ADMIN can approve or reject them; only approved nutritionists are listed. User words: "hay nutricionistas dados de alta en la aplicación que vos como asesorado podrás elegir: Ejemplo: Emanuel, Sandra y Lucas."
  - Assumption: the first ADMIN is created with a CLI script (`pnpm admin:promote <email>`).
- **S4** — A client picks a nutritionist from the directory and requests to work with them; the nutritionist accepts or rejects. User words: "Vos, asesorado podés querer trabajar con Emanuel y si te acepta empiezas a trabajar con el (el nutricionista se encargará de manejar sus cobros por fuera de la aplicación o manejará cómo y a quién dejará ingresar a sus planes)."
  - Billing is out of scope.
  - Assumption: a client may request again after a rejection.
- **S5** — A client can have several nutritionists at the same time. User words: "Un asesorado puede tener más de un nutricionista a la vez, piensa en deportistas que tienen un equipo de nutrición".
- **S6** — A nutritionist can access a client's data only while their link is ACCEPTED (enforced server-side, close to the data).

Out of scope (not requested yet): ending a relationship, visibility between nutritionists of the same client, social login, email verification, Spanish UI copy.

## Tasks

| ID | Specs | Route | Status | Commit |
|----|-------|-------|--------|--------|
| T0 | — | inline | done | 02b6484 (prior DB/USDA setup) |
| T1 | S1, S2 | inline | pending | |
| T2 | S3 | inline | pending | |
| T3 | S4, S5, S6 | inline | pending | |

Route evidence: one sequential feature, no parallel units → no writer trigger. Risk: item 2 (auth/permissions) on T1–T3 → one independent verifier at feature end.

## Log

- **L1** (2026-11-13) — User request: "Continuemos con los roles y luego cargamos los nombres en español"
- **L2** (2026-11-13) — "Qué te parece lo siguiente: Registro libre, hay nutricionistas dados de alta en la aplicación que vos como asesorado podrás elegir: Ejemplo: Emanuel, Sandra y Lucas. Vos, asesorado podés querer trabajar con Emanuel y si te acepta empiezas a trabajar con el (el nutricionista se encargará de manejar sus cobros por fuera de la aplicación o manejará cómo y a quién dejará ingresar a sus planes). Un asesorado puede tener más de un nutricionista a la vez, piensa en deportistas que tienen un equipo de nutrición"
- **L3** (2026-11-13) — "Me parece bien lo del administrador" (admin verifies nutritionists before they appear in the directory).
- **L4** (2026-11-13) — "Vamos con better auth". Better Auth 1.7.x stable; Auth.js v5 still beta.
- **L5** — Next 16 notes: `cacheComponents: true` → session reads go inside `<Suspense>`; authorization re-verified in every Server Action (DAL pattern); Proxy only for optimistic redirects.
