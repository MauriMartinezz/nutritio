# Feature: food-names-es

Objective: Spanish (Argentina) names for ~200 common foods, grouped into raw/cooked variants so the plan editor can offer a raw/cooked toggle.
Branch: `feat/food-names-es` (stacked on `feat/auth-roles`) · Delivery: `ask-on-risk` · Test runner: `pnpm test`.

## Specs

- **S1** — Spanish names for a first list of ~200 common foods, curated by Claude and reviewed by the user. User words: "Me parece bien" (to: Claude drafts the list, the user reviews it).
- **S2** — Raw/cooked: "Quizá sería interesante que el nutricionista a la hora de incluír un alimento tenga un toggle de si es crudo o cocido". Design accepted ("Perfecto. avanza con el diseño y la lista"):
  - each food gets a preparation (RAW, COOKED, or none for "as is" foods) and a group key linking its variants;
  - one representative cooked method per food (boiled for rice/pasta/legumes, roasted/grilled for meats), shown as a note;
  - foods that are not cooked (avocado, yogurt, oil) have a single "as is" variant and no toggle.
- **S3** — The list is a versioned file applied by an idempotent script; re-importing USDA must not erase it.

Out of scope: the toggle UI itself (plan editor does not exist yet), extra cooking methods.

## Tasks

| ID | Specs | Route | Status | Commit |
|----|-------|-------|--------|--------|
| T1 | S2, S3 | inline | done | see git log (feat(foods)) |
| T2 | S1, S2 | delegated (writer: parallel unit, disjoint file) | done — pending user review | see git log (feat(foods): add) |

## Log

- **L1** (2026-11-13) — "Me parece bien. Quizá sería interesante que el nutricionista a la hora de incluír un alimento tenga un toggle de si es crudo o cocido"
- **L2** (2026-11-13) — "Perfecto. avanza con el diseño y la lista"
- **L3** — T2 writer: 218 entries / 296 variants, 0 missing or repeated fdcIds, 0 null macros; 78 raw+cooked pairs. Meats use "separable lean only"; ground beef común/especial/magra = 80/20, 90/10, 95/5. No USDA hake (Merluza → whiting), dulce de leche, yerba mate.
- **L4** — Parent check: applied (idempotent, ran twice), spot pairs OK (arroz 370→130 kcal, pechuga 120→165), 296 variants intact after `pnpm usda:import`. Risk: none (additive columns, seed data). RDD: not escalated.
