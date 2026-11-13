# Feature: meal-plans

Objective: nutritionists build daily meal plans for their clients (meals → food items with grams and a raw/cooked toggle, macros computed); clients read their plans.
Branch: `feat/meal-plans` (main checkout, stacked on `feat/admin-nutritionists`) · Delivery: `ask-on-risk` · Test runner: `pnpm test` (node:test via tsx).

## Specs

- **S1** — Plan ownership and access. A plan belongs to one nutritionist. A plan assigned to a client can be created, edited or deleted only by its nutritionist while their link with that client is ACCEPTED (reuse `requireClientAccess` from `modules/coaching/dal.ts`). User words (original vision): "el nutricionista podrá gestionar: cantidades de cada comida, macronutrientes".
  - Assumption: a nutritionist may keep several plans per client; the client sees all plans assigned to them, newest first.
- **S2** — Templates. User words: "Plan (modificable, flexible, dinámico, reutilizable)". A plan without a client is a template owned by its nutritionist; "use template" copies it (meals and items) into a new plan for one of the nutritionist's ACCEPTED clients. Editing the copy never changes the template.
- **S3** — Single daily plan. Decision (user answered "Bien" to option 1, "Un plan diario único"): one ordered list of meals repeated every day. Meals have an editable name and order; a new plan starts with Breakfast, Lunch, Snack, Dinner. Meals can be added, renamed, reordered and removed.
- **S4** — Items. Each meal item = food + grams (> 0, up to 2000) + optional note. Food search uses the curated catalog first (`foods.name_es`, then `name_en`). The raw/cooked toggle: when the chosen food's `group_key` has both a RAW and a COOKED variant, the item can switch between them; switching changes the item's food to the other variant of the same group and keeps the grams. User words: "Quizá sería interesante que el nutricionista a la hora de incluír un alimento tenga un toggle de si es crudo o cocido".
- **S5** — Macros. Show kcal, protein, carbs and fat per item (food values are per 100 g, so value × grams / 100), per meal and per day. Foods with a null value count as 0 for that value and the UI flags the total as incomplete.
- **S6** — Client view. A client sees their assigned plans read-only, grouped by nutritionist (a client can have several nutritionists), with the same per-meal and daily totals. Clients never see templates or other clients' plans.

Out of scope: food alternatives/equivalences, recipes, per-weekday plans, PDF export, Spanish UI copy (UI copy stays in English).

## Tasks

| ID | Specs | Route | Status | Commit |
|----|-------|-------|--------|--------|
| T1 | S3, S4, S5 | inline | done | (T1 commit) |
| T2 | S1, S2, S3, S4, S5 | inline | pending | |
| T3 | S6 | inline | pending | |

T1: schema + migration (meal_plans, meals, meal_items) and pure rules (default meals, grams, macros, variant switch, template copy).
T2: nutritionist side — plan access guard, server actions, client plans list, template list, plan editor with food search and raw/cooked toggle.
T3: client read-only view of assigned plans.

Risk: item 2 (plan access guards) → independent verifier at feature end. The migration only adds tables (no existing data changes).

## Log

- **L1** (2026-11-13) — "Si, scontinua con eso de hacer los planes"
- **L2** (2026-11-13) — Daily plan decision: user answered "Bien" to the single daily plan proposal.
- **L3** (2026-11-13) — "No puedes trabajar con ambas tareas en paralelo?" → meal plans run in this worktree while admin nutritionist management runs in the main checkout.
- **L4** (2026-11-13) — "Perfecto, empieza con los planes de comida". Admin feature finished, so no parallel unit remains: worktree removed, work continues inline in the main checkout on `feat/meal-plans` fast-forwarded to e38e1ed (needs the T3 revocation guard in `canAccessClient`).
- **L5** (2026-11-13) — T1: data check showed every food group has at most one RAW and one COOKED variant, so the toggle is unambiguous. Migration `meal_plans` adds meal_plans, meals, meal_items (grams stored as whole numbers). Rules RED 1 suite → GREEN 55/55; tsc, lint clean.
