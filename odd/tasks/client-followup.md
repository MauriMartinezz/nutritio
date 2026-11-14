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
- **S9b** — Diet adherence. User words: "En el seguimiento el asesorado podrá indicar cuánto pudo seguir de la dieta, quizá un slider esté bien". Check-in field `dietAdherence` 0–100 % (slider, step 5), shown in both histories.
- **S10** — Preferences and medical. User words: "El usuario podrá tener preferencias o cuestiones médicas: dietas bajas en carbohidratos, vegano, vegetariano, si prefiere hacer meal prep, si prefiere comidas básicas o más elaboradas, intolerante a X alimento, diabético, etc."
- **S11** — Fees and bio. User words: "El nutricionista podrá cargar sus honorarios y el cliente podrá verlos antes de contratarlo" and "el nutricionista puede dar una breve descripción: Quién es, dónde estudió, qué puede incluir su plan." Editable by the nutritionist on their own profile page; shown in the directory before requesting.

- **S12** — Theme. User words: "se podría agregar que el usuario pueda cambiar el tema, de claro a oscuro o viceversa y que se persista (esto no hace falta que quede en la base, con que quede en el localstorage está bien)". Default follows the system until the user picks one.

Assumptions (portfolio scope, approximate is fine): ratings 1–5; check-in due = last check-in (or access start) + frequency; fees = amount + currency + free-text description, shown in the directory; preferences are a fixed checklist plus free-text intolerances/notes, visible to the client's nutritionists; the badge counts pending link requests + meeting requests.

## Tasks

| ID | Specs | Route | Status | Commit |
|----|-------|-------|--------|--------|
| T1 | S11 | delegated (context backstop) | done | 9a8b514 |
| T2 | S10 | delegated (context backstop) | done | ceaa1b1 |
| T3 | S1, S9 | delegated (context backstop) | done | f72ee2c |
| T4 | S2, S7 | delegated (context backstop) | done | ef04d3c |
| T5 | S3 | delegated (context backstop) | done | (T5) |
| T6 | S8 | delegated (context backstop) | pending | |
| T7 | S4 | delegated (context backstop) | pending | |
| T8 | S5, S6 | delegated (context backstop) | pending | |
| T9 | S12 | inline | done | 892ddbc |
| T10 | S9b | inline (after T5, shares schema.prisma) | pending | |

Risk: item 2 (client data visible to nutritionists, medical info) → independent verifier at feature end.

## Log

- **L1** (2026-11-14) — "Bien, muy bien! Me gustaría trabajar en ciertas cosas: 1) El nutricionista debe pactar cada cuánto se necesita un chequeo, cada 7 días, cada 15, etc. 2) El usuario debe poder ver la evolución de su peso. 3) El usuario debe poder cargar las actividades físicas que realiza: fuerza, gimnasio, calistenia, futbol, etc. 4) Cada plan irá acompañado de una lista de compras semanal, con la posibilidad de multiplicarlo para hacerlo quincenal o mensual. 5) Las recetas del nutricionista puede contener adicionales: verduras con pocas o nulas calorías, condimentos, etc. 6) Las recetas del nutricionista pueden ser de más de 1 porcion por ejemplo si la receta es para meal prep. 7) el usuario verá que tiene la revisión pendiente y puede cargarla además de que en el inicio se verá su evolución y cuánto falta para su chequeo y cuánto le queda de suscripción. 8) El usuario podrá pedir una reunión o visita con el nutricionista, al nutricionista le llegará una notificación en la app o le aparecerá un N en amarillo que indique que se le requiere para tomar una acción. 9) En el chequeo, el usuario puede cargar notas y puntuar ciertos aspectos: sueño, si pudo completar sus entrenamientos pactados, si tuvo alguna molestia, etc. 10) El usuario podrá tener preferencias o cuestiones médicas: dietas bajas en carbohidratos, vegano, vegetariano, si prefiere hacer meal prep, si prefiere comidas básicas o más elaboradas, intolerante a X alimento, diabético, etc. 11) El nutricionista podrá cargar sus honorarios y el cliente podrá verlos antes de contratarlo"
- **L2** (2026-11-14) — drag-and-drop committed as cc0aaa0 on feat/plan-dnd after the user's "Bien, muy bien!".
- **L3** (2026-11-14) — "Sí, me olvidé mencionar que el nutricionista puede dar una breve descripción: Quién es, dónde estudió, qué puede incluir su plan. Las recetas son las comidas del plan, aunque una receta puede rendir más de 1 porción" → S11 extended with bio; S5/S6 attach to plan meals.
- **L4** (2026-11-14) — Route: parent context is long (advisory backstop), so each task goes to one bounded writer, sequentially (tasks share schema.prisma and pages, so no parallel writers); parent reviews diff, spot-checks, commits.
- **L5** (2026-11-14) — T1 (writer): bio, education, plan includes, fee (amount ARS/USD + description) on /profile, shown in directory. Writer RED→GREEN 73/73, tsc, lint. Parent E2E on an isolated `next start` (test-only auth secret, port 3100): 7/7 (save, negative fee rejected, client sees it, client cannot update). The user's running dev server keeps the old Prisma client in globalThis after migrations → needs a restart.
- **L6** (2026-11-14) — T2 (writer): client_preferences 1:1 (diet flags, meal prep, cooking style, diabetic/celiac/hypertension, intolerances, notes) on /preferences; nutritionist reads them only via requireClientAccess on the client page. Writer RED→GREEN 80/80, tsc, lint. Parent E2E isolated: 9/9 (save, linked nutritionist sees, unlinked sees nothing, not in directory/lists, nutritionist cannot write).
- **L7** (2026-11-14) — T3 (writer): check_in_every_days on the link (nutritionist sets it on the client page), check_ins (weight, sleep/training/energy/hunger 1–5, discomfort + notes), client /check-ins with status and history, nutritionist history via requireClientAccess; `getClientCheckInSummary` for T4. Writer RED→GREEN 87/87, tsc, lint. Parent E2E isolated: 13/13 + tamper 2/2 (signed-in other client cannot post to the link). Advisory (framework): re-posting a stale no-JS useActionState form (bound args) right after a successful submit hangs the request in `next start`; a fresh page load avoids it, browsers always post the freshly rendered form. Better Auth's production rate limit blocks a 4th sign-up within seconds (test artifact).
- **L8** (2026-11-14) — New request (mid-turn): "Excelente, ya que hay una sección de Preferencias, se podría agregar que el usuario pueda cambiar el tema, de claro a oscuro o viceversa y que se persista (esto no hace falta que quede en la base, con que quede en el localstorage está bien)" → S12, task T9.
- **L9** (2026-11-14) — T9 inline: theme in localStorage (`nutritio-theme`), head script sets `data-theme` before paint (falls back to system; storage errors ignored), Tailwind `dark:` variant driven by data-theme with a no-JS media fallback, Light/Dark toggle on /preferences. Tests 91/91 (written together with the code, RED not observed separately), tsc, lint, build; compiled CSS contains both selectors; live check 4/4 (script in head, toggle renders, preferences form intact). Toggle lives on the client preferences page only.
- **L10** (2026-11-14) — T4 (writer): client home "Your follow-up" per nutritionist (days of access left / expired message, check-in due with link / next in N days, latest weight and change), dependency-free SVG weight chart (aria summary + hidden table) on home and /check-ins. Writer RED→GREEN 100/100, tsc, lint. Parent E2E isolated: 13/13 (empty state, access days, due, weight change, chart, expired message, not shown to nutritionists or signed-out). Dates use server-locale toLocaleDateString (advisory).
- **L11** (2026-11-14) — "En el seguimiento el asesorado podrá indicar cuánto pudo seguir de la dieta, quizá un slider esté bien" → S9b / T10, done inline after T5 to avoid concurrent schema edits.
- **L12** (2026-11-14) — T5 (writer): activities (type enum incl. OTHER + custom name, date, minutes, intensity, notes) on /activities with weekly summary and 30-day list, owner-scoped delete; nutritionist "Activity" section via requireClientAccess. Writer RED→GREEN 108/108, tsc, lint. Parent E2E isolated: 11/11 (save, invalid rejected, weekly total, linked/unlinked nutritionist, non-owner delete blocked).
