# Feature: client-followup

Objective: check-ins on an agreed schedule (weight, notes, ratings), weight evolution, activity log, client home dashboard, meeting requests with a pending-action badge, client preferences/medical info, nutritionist fees, weekly shopping lists, and recipes with extras and servings.
Branch: `feat/client-followup` (stacked on `feat/plan-dnd`) · Delivery: `ask-on-risk` · Test runner: `pnpm test`.

## Specs

- **S1** — Check-in frequency. User words: "El nutricionista debe pactar cada cuánto se necesita un chequeo, cada 7 días, cada 15, etc." Per client link, set by the nutritionist (days).
- **S2** — Weight evolution. User words: "El usuario debe poder ver la evolución de su peso." Weight comes from check-ins; shown as a chart.
- **S3** — Activities. User words: "El usuario debe poder cargar las actividades físicas que realiza: fuerza, gimnasio, calistenia, futbol, etc."
- **S4** — Shopping list. User words: "Cada plan irá acompañado de una lista de compras semanal, con la posibilidad de multiplicarlo para hacerlo quincenal o mensual." Derived from the plan items: per food, (grams ÷ meal servings) × 7 for a week, ×2 biweekly, ×4 monthly.
- **S5/S6 decision** — User words: "Las recetas son las comidas del plan, aunque una receta puede rendir más de 1 porción". A meal of the plan is the recipe: it gets `servings` (default 1) and free-text extras. Item grams are for the whole recipe; per-serving (= daily) values are totals ÷ servings.
- **S5** — Recipe extras. User words: "Las recetas del nutricionista puede contener adicionales: verduras con pocas o nulas calorías, condimentos, etc."
- **S6** — Recipe servings. User words: "Las recetas del nutricionista pueden ser de más de 1 porcion por ejemplo si la receta es para meal prep."
- **S7** — Client home. User words: "el usuario verá que tiene la revisión pendiente y puede cargarla además de que en el inicio se verá su evolución y cuánto falta para su chequeo y cuánto le queda de suscripción."
- **S8** — Meeting requests. User words: "El usuario podrá pedir una reunión o visita con el nutricionista, al nutricionista le llegará una notificación en la app o le aparecerá un N en amarillo que indique que se le requiere para tomar una acción."
- **S9** — Check-in content. User words: "En el chequeo, el usuario puede cargar notas y puntuar ciertos aspectos: sueño, si pudo completar sus entrenamientos pactados, si tuvo alguna molestia, etc."
- **S10** — Preferences and medical. User words: "El usuario podrá tener preferencias o cuestiones médicas: dietas bajas en carbohidratos, vegano, vegetariano, si prefiere hacer meal prep, si prefiere comidas básicas o más elaboradas, intolerante a X alimento, diabético, etc."
- **S11** — Fees and bio. User words: "El nutricionista podrá cargar sus honorarios y el cliente podrá verlos antes de contratarlo" and "el nutricionista puede dar una breve descripción: Quién es, dónde estudió, qué puede incluir su plan." Editable by the nutritionist on their own profile page; shown in the directory before requesting.

Assumptions (portfolio scope, approximate is fine): ratings 1–5; check-in due = last check-in (or access start) + frequency; fees = amount + currency + free-text description, shown in the directory; preferences are a fixed checklist plus free-text intolerances/notes, visible to the client's nutritionists; the badge counts pending link requests + meeting requests.

## Tasks

| ID | Specs | Route | Status | Commit |
|----|-------|-------|--------|--------|
| T1 | S11 | delegated (context backstop) | done | (T1) |
| T2 | S10 | delegated (context backstop) | pending | |
| T3 | S1, S9 | delegated (context backstop) | pending | |
| T4 | S2, S7 | delegated (context backstop) | pending | |
| T5 | S3 | delegated (context backstop) | pending | |
| T6 | S8 | delegated (context backstop) | pending | |
| T7 | S4 | delegated (context backstop) | pending | |
| T8 | S5, S6 | delegated (context backstop) | pending | |

Risk: item 2 (client data visible to nutritionists, medical info) → independent verifier at feature end.

## Log

- **L1** (2026-11-14) — "Bien, muy bien! Me gustaría trabajar en ciertas cosas: 1) El nutricionista debe pactar cada cuánto se necesita un chequeo, cada 7 días, cada 15, etc. 2) El usuario debe poder ver la evolución de su peso. 3) El usuario debe poder cargar las actividades físicas que realiza: fuerza, gimnasio, calistenia, futbol, etc. 4) Cada plan irá acompañado de una lista de compras semanal, con la posibilidad de multiplicarlo para hacerlo quincenal o mensual. 5) Las recetas del nutricionista puede contener adicionales: verduras con pocas o nulas calorías, condimentos, etc. 6) Las recetas del nutricionista pueden ser de más de 1 porcion por ejemplo si la receta es para meal prep. 7) el usuario verá que tiene la revisión pendiente y puede cargarla además de que en el inicio se verá su evolución y cuánto falta para su chequeo y cuánto le queda de suscripción. 8) El usuario podrá pedir una reunión o visita con el nutricionista, al nutricionista le llegará una notificación en la app o le aparecerá un N en amarillo que indique que se le requiere para tomar una acción. 9) En el chequeo, el usuario puede cargar notas y puntuar ciertos aspectos: sueño, si pudo completar sus entrenamientos pactados, si tuvo alguna molestia, etc. 10) El usuario podrá tener preferencias o cuestiones médicas: dietas bajas en carbohidratos, vegano, vegetariano, si prefiere hacer meal prep, si prefiere comidas básicas o más elaboradas, intolerante a X alimento, diabético, etc. 11) El nutricionista podrá cargar sus honorarios y el cliente podrá verlos antes de contratarlo"
- **L2** (2026-11-14) — drag-and-drop committed as cc0aaa0 on feat/plan-dnd after the user's "Bien, muy bien!".
- **L3** (2026-11-14) — "Sí, me olvidé mencionar que el nutricionista puede dar una breve descripción: Quién es, dónde estudió, qué puede incluir su plan. Las recetas son las comidas del plan, aunque una receta puede rendir más de 1 porción" → S11 extended with bio; S5/S6 attach to plan meals.
- **L4** (2026-11-14) — Route: parent context is long (advisory backstop), so each task goes to one bounded writer, sequentially (tasks share schema.prisma and pages, so no parallel writers); parent reviews diff, spot-checks, commits.
- **L5** (2026-11-14) — T1 (writer): bio, education, plan includes, fee (amount ARS/USD + description) on /profile, shown in directory. Writer RED→GREEN 73/73, tsc, lint. Parent E2E on an isolated `next start` (test-only auth secret, port 3100): 7/7 (save, negative fee rejected, client sees it, client cannot update). The user's running dev server keeps the old Prisma client in globalThis after migrations → needs a restart.
