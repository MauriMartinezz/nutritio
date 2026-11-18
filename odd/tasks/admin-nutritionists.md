# Feature: admin-nutritionists

Objective: nutritionist profile data captured at sign-up, and an admin area to list, filter, edit and change the status of nutritionists.
Branch: `feat/admin-nutritionists` (stacked on `feat/food-names-es`) · Delivery: `ask-on-risk` · Test runner: `pnpm test`.

## Specs

- **S1** — Admin lists nutritionists by status. User words: "me gustaría que el administrador pueda gestionar y ver los nutricionistas verificados, los pendientes, los rechazados."
- **S2** — Admin edits status and values. User words: "Que los puedan editar su estado o sus valores (nombre, mail, dni, etc)". Any status change is allowed (approve, reject, revoke an approved one).
- **S3** — Nutritionist data. User words: "Los datos que quiero del nutricionista son nombre, dni, mail, matricupa profesional, fecha de nacimiento, telefono de contacto, especialidad y creo que por ahora nada mas".
  - Assumptions: entered by the nutritionist at sign-up; all required except specialty; DNI 7–8 digits and unique; age 18–100; license is free text; phone 6–20 chars of digits, spaces, `+`, `-`, `()`.
  - Assumption: after sign-up only an admin can change these fields (prevents changing the license after verification).
  - Changing the email changes the login email; email stays unique.
- **S4** — Revocation (proposed by Claude, not objected): a nutritionist who is not APPROVED loses access to all client data and disappears from the directory; links are kept so re-approval restores access.

Out of scope: audit log of admin changes, editing clients, deleting users.

## Tasks

| ID | Specs | Route | Status | Commit |
|----|-------|-------|--------|--------|
| T1 | S3 | inline | done | f4d9ec6 |
| T2 | S1, S2 | inline | done | d42b3f3 |
| T3 | S4 | inline | done | 62c8db6 |
| T4 | S2, S3 | inline | done | verifier fixes (see L6) |

Risk: item 2 (permissions) → independent verifier at feature end.

## Log

- **L1** (2026-11-13) — "Bien, me gustaría que el administrador pueda gestionar y ver los nutricionistas verificados, los pendientes, los rechazados. Que los puedan editar su estado o sus valores (nombre, mail, dni, etc)"
- **L2** (2026-11-13) — "No puedes trabajar con ambas tareas en paralelo?" → parallel writer for meal plans was denied by the permission classifier; user did not choose, so work proceeds sequentially (admin first, meal plans after; spec ready in worktree `nutritio-worktrees/meal-plans`).
- **L3** (2026-11-13) — "Los datos que quiero del nutricionista son nombre, dni, mail, matricupa profesional, fecha de nacimiento, telefono de contacto, especialidad y creo que por ahora nada mas"
- **L4** (2026-11-13) — Session resumed after the terminal closed. T2 was written but uncommitted; checks green (38 tests, tsc, lint), committed as d42b3f3.
- **L5** (2026-11-13) — T3: found two S4 gaps — `canAccessClient` ignored the nutritionist status and `respond()` let a non-approved nutritionist answer requests. RED 2 failing → GREEN 40/40; tsc and lint clean. Status is read from the DB per request, so revocation is immediate.
- **L6** (2026-11-13) — Independent verifier: S1, S2, S4 pass; S3 FAIL. B1: sign-up client sends birthDate as a full ISO string and `parseDate` only accepted YYYY-MM-DD → every nutritionist sign-up rejected. B2: phone regex counted 6–20 digits, not chars; column is VARCHAR(20) → possible 500. B3: Prisma 7 adapter has no `meta.target`, so a duplicate DNI was reported as an email clash. One correction batch: RED 3 → GREEN 45/45, tsc and lint clean; `lib/` added to the test glob. Advisory kept: sign-up DNI check-then-insert race can 500 (unlikely).
