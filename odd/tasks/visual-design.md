# Feature: visual-design

Objective: apply the Claude Design visual language (`nutrio-design/DESIGN.md`, `tokens.css`, `screens/`) to the existing screens — tokens, IBM Plex typography, cards, spacing, app shell with sidebar, responsive. No new business features.
Branch: `feat/visual-design` (stacked on `feat/client-followup`) · Delivery: `ask-on-risk` · Test runner: `pnpm test` (styling has no runnable RED; checks are tsc, lint, build, existing tests, and a live render check).

## Specs

- **S1** — Scope. User words: "Si arranca aplicando el lenguaje visual". Only the visual language on existing screens; the design's new features (payments, recipe library, shopping sections/checkboxes, admin audit) are out of scope for now.
- **S2** — Tokens and type. From `nutrio-design/tokens.css` and DESIGN.md: IBM Plex Sans (400/500/600/700) for text, IBM Plex Mono (500/600) for figures (kcal, weights, quantities, big dates, KPIs); headings 600 with letter-spacing -0.02em; bg #F7F7F4, surface #FFFFFF, ink #1A1A17, secondary #5F5F58, borders #E3E3DE; single accent #1F5C4A (hover #16443A, tint #EAF1EE); state colors only for states; radii 12/8/6/4; 1px borders, no shadows or gradients; controls ≥ 44px.
- **S3** — Layout. Web: 240px sidebar with role-based navigation and fluid content; on mobile the menu moves to the top.
- **S4** — Components. Every existing screen uses the shared tokens and primitives (cards, buttons, inputs, badges) instead of ad-hoc zinc/emerald classes.

Assumptions: the app keeps its name "Nutritio" (the design says "nutrio"); UI copy stays English; the existing light/dark toggle stays, with dark tokens derived from the light palette (the design defines none); the pending-actions badge stays yellow (explicit user request in S8 of client-followup: "un N en amarillo").

## Tasks

| ID | Specs | Route | Status | Commit |
|----|-------|-------|--------|--------|
| V1 | S2, S3 | inline (foundation: tokens, fonts, ui primitives, app shell) | done | (V1) |
| V2 | S4 | delegated (parallel unit A: plans, foods) | pending | |
| V3 | S4 | delegated (parallel unit B: coaching, clients, meetings, nutritionists, identity, admin) | pending | |
| V4 | S4 | delegated (parallel unit C: checkins, activities, home, theme, remaining app pages) | pending | |

Route evidence: V2–V4 are independent units with disjoint edit surfaces, each several files and 100+ changed lines, launched together (Writer trigger a). Risk: item 6 (visual changes have no tests) → live render check per screen; no independent verifier unless a unit touches logic.

## Log

- **L1** (2026-11-14) — "Si arranca aplicando el lenguaje visual" (answer to: apply only the visual language — tokens, IBM Plex, cards, sidebar and responsive — to existing screens first, new design features later one by one). Context: "En la carpeta de nutrio design hay unas bases que estuve haciendo con Claude Design para basarnos en lo que será el diseño: las cards, el responsive, el espaciado, la tipografía, los colores, layouts, etc"
- **L2** (2026-11-14) — V1 inline: semantic tokens in app/globals.css (light from tokens.css, dark derived) exposed as Tailwind colors (`bg-surface`, `text-ink`, `text-secondary`, `border-line`, `bg-accent`, `text-on-accent`, `bg-accent-tint`, state `danger|warning|success` + `-bg`) and radii (`rounded-card-lg|card|control|badge`); IBM Plex Sans/Mono via next/font; shared classes in `modules/ui/classes.ts`; app shell in app/layout.tsx: 240px sticky sidebar (role nav from `modules/identity/components/app-nav.tsx`, active link via aria-current, user card + sign out) that becomes a top bar with a scrollable link row on mobile; nav links moved out of AccountPanel, which is now a greeting card. tsc, lint, 130/130 tests, build; screenshots checked at 1280 and 390, light and dark.
