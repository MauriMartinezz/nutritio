# Feature: client-access

Objective: nutritionists grant clients time-limited access (X days/weeks/months); expired clients lose access to their plans; a dashboard shows expiring and expired clients with manual and automatic renewal.
Branch: `feat/client-access` (stacked on `feat/meal-plans`) · Delivery: `ask-on-risk` · Test runner: `pnpm test`.

## Specs

- **S1** — Access period. User words: "Me parecería bien que el nutricionista le brinde acceso por X días a una persona, ellos arreglan, entonces si pasados esos X días no se renueva, el cliente pierde el acceso." The nutritionist picks the period (amount + unit: days, weeks, months) when accepting a client; access lasts until accepted-at + period.
  - Assumption: default period at acceptance is 1 month; amount 1–365.
  - Assumption: months are calendar months (Jan 31 + 1 month = Feb 28/29).
- **S2** — Expiry. When access expires the client stops seeing that nutritionist's plans (the client view says the access expired). The nutritionist keeps seeing the client and their plans, so they can renew. Renewal restores everything.
  - Assumption: a client sees plans only while the link is ACCEPTED and access is active (answers the open "plans after the link ends" decision).
- **S3** — Dashboard. User words: "El nutricionista debe tener un dashboard con clientes próximos a renovar y vencidos que pueda renovar". Sections: expiring soon, expired, active, each with its access end date.
  - Assumption: "expiring soon" = expires within the next 7 days.
- **S4** — Manual renewal. User words: "Quizá un botón de Renovar y que ahí pregunte por cuánto tiempo y que por defecto sea el tiempo que se dio de alta (por ejemplo, el nutricionista le dio acceso por 1 mes y por defecto que le aparezca 1 mes al renovar salvo que lo cambie)". Renewing extends from the current end date if still active, or from now if expired.
- **S5** — Automatic renewal. User words: "En realidad me gustaría que el nutricionista pueda renovar cada X tiempo que quiera (X días, X semanas, X meses)". Per client toggle with its own period; when on, an expired end date rolls forward by that period automatically (no payments).
  - Assumption: one period per client: setting auto-renew with a period also becomes the default for the Renew button.

Out of scope: payments, notifications/emails, client-initiated renewal.

## Tasks

| ID | Specs | Route | Status | Commit |
|----|-------|-------|--------|--------|
| T1 | S1, S2, S4, S5 | inline | done | (T1) |
| T2 | S1, S3, S4, S5 | inline | pending | |
| T3 | S2 | inline | pending | |

T1: schema + migration (period, access end, auto-renew on nutritionist_clients) and pure access rules.
T2: accept with period, dashboard on /clients, Renew form, auto-renew setting.
T3: client view enforces access; expired message.

Risk: item 2 (client access) and item 1 (migration backfills existing accepted links with 1 month from migration time; dev data only) → independent verifier at feature end.

## Log

- **L1** (2026-11-13) — "Me parecería bien que el nutricionista le brinde acceso por X días a una persona, ellos arreglan, entonces si pasados esos X días no se renueva, el cliente pierde el acceso. El nutricionista debe tener un dashboard con clientes próximos a renovar y vencidos que pueda renovar o renovar automáticamente(por ejemplo por 3 meses)"
- **L2** (2026-11-13) — Clarification answer: "1) En realidad me gustaría que el nutricionista pueda renovar cada X tiempo que quiera (X días, X semanas, X meses) 2)no me gusta esta opcion. Quizá un botón de Renovar y que ahí pregunte por cuánto tiempo y que por defecto sea el tiempo que se dio de alta (por ejemplo, el nutricionista le dio acceso por 1 mes y por defecto que le aparezca 1 mes al renovar salvo que lo cambie)"
- **L3** (2026-11-13) — T1: access rules RED (suite missing) → GREEN 64/64. Migration `client_access` adds access_amount/unit/until and auto_renew; backfills existing ACCEPTED links with 1 month from now. Auto-renew is computed lazily (roll forward on read), no scheduled job.
