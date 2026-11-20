# i18n: Spanish and English, chosen by the browser language

Objective: the whole app available in Spanish (es-AR focus) and English. Branch: `feat/i18n` (from `feat/postgres` at ddf78eb). Delivery: ask-on-risk. Test runner: `npm test` (tsx --test).

## Specs

- S1: "Debe haber la opción de tener la aplicación en español, sobretodo pensando que en principio será una aplicación hecha para Argentina" — every user-facing string (pages, nav, forms, buttons, validation/server error messages, metadata titles) exists in Spanish and English.
- S2: Language is chosen "Según el idioma del navegador": the `Accept-Language` header picks `es` or `en`. Assumption: when the browser asks for neither, the app falls back to Spanish (Argentina-first).
- S3: A manual language selector lets the person override the browser choice; the choice is remembered in that browser (cookie). Assumption: placed in Profile → Appearance, next to the theme, and also reachable signed-out (sign-in/sign-up).
- S4: URLs do not change (no visible `/es/...` prefix); `<html lang>` matches the active language.
- S5: Dates and numbers are formatted for the active language (es-AR: dd/mm/yyyy, decimal comma).

## Tasks

| ID | Specs | Route | Status | Commit |
|----|-------|-------|--------|--------|
| T1 | S2-S5, S1 for app shell | inline: locale negotiation (pure, tested), `proxy.ts` rewrite to `app/[lang]`, `next/root-params`, message pattern, selector, shell translated | done | (this commit) |
| T2 | S1 | delegated (parallel units): identity, home, theme + sign-in/sign-up/profile/preferences routes | todo | |
| T3 | S1 | delegated (parallel units): nutritionists + admin + nutritionists routes | todo | |
| T4 | S1 | delegated (parallel units): clients, coaching, checkins + clients/check-ins routes | todo | |
| T5 | S1 | delegated (parallel units): plans, foods + plans/my-plans routes | todo | |
| T6 | S1 | delegated (parallel units): activities, meetings, ui + their routes | todo | |
| U1 | L5 | inline: landing page, no sidebar on sign-in/sign-up, sign-out clears the login form, "remember me", button spinners | done (spinner component + identity forms; other modules adopt it in T2-T6) | (this commit) |
| U2 | L7 | inline: admin dashboard of clients to fix their data (e.g. name) | todo | |
| U3 | L8 | inline: Contact section (title + description) → admin inbox, reply, close as completed; admin user profile with request history (shares the admin user page with U2) | todo | |
| T7 | S1-S5 | inline: seam check, full suite, build, manual check of both languages | todo | |

Route evidence: T2-T6 are independent units with disjoint edit surfaces (one module group each, several files and well over 100 changed lines each), launched together after T1 fixes the shared pattern (Writer trigger a).

## Design

- `proxy.ts` negotiates the locale (cookie `NEXT_LOCALE` > `Accept-Language` > `es`) and **rewrites** `/path` to `/[lang]/path`, so URLs stay unchanged. It also forwards the locale in a request header for Server Actions, where `next/root-params` is unavailable.
- All routes move under `app/[lang]/` (except `app/api`). Server Components read the locale with `lang()` from `next/root-params`; `generateStaticParams` returns `es` and `en` (required by `cacheComponents`).
- Messages live next to each module as `messages.ts`: `{ en: {...}, es: {...} }`, typed so `es` must have every `en` key. Server: `t = messages[await getLocale()]`; Client: `useLocale()` from a provider in the root layout.
- Pure domain parsers keep their English default and take an optional `locale`, so existing tests keep passing; actions pass the request locale.

## Log

- L1 (2026-11-20, user): "Debe haber la opción de tener la aplicación en español, sobretodo pensando que en principio será una aplicación hecha para Argentina"
- L2 (2026-11-20, user, choosing how the language is picked): "Según el idioma del navegador"
- L3 (2026-11-20): the working tree on `feat/postgres` holds uncommitted earlier work (admin:set-role, profile account card, nutritionist field formats + DNI migration) that overlaps files this feature moves; waiting for the user's decision on committing it before branching.
- L4 (2026-11-20, user): "Haz los commits y luego arranca con el español" — earlier work committed on feat/postgres (421f6f4..ddf78eb); branch feat/i18n created.
- L5 (2026-11-20, user): "Hay que crear una landing más estética, que describa el producto. Además, no debe haber un sidebar en el login, no tiene sentido esa navegación. También hay un erro y es que si le doy a sign out el formulario de login sigue estando completado! es un peligro eso. Se debe agregar un checkbox de Recordar usuario. Agregar spinner en los botones cuando se llama un CTA" — tracked as U1, done before the translation writers so they translate the new texts too.
- L6 (2026-11-20): T1 verified against the local Docker DB on port 3100: `Accept-Language: es-AR` → `<html lang="es">`, `en-US` → `en`, cookie `NEXT_LOCALE=en` overrides `es`; `/api/auth/get-session` and `/favicon.ico` 200; nav marks the active link. 177 tests, tsc, eslint clean.
- L7 (2026-11-20, user): "El administrador también debe tener un dashboard de Clientes, para poder modificar datos en caso de emergencia, ejemplo: llega por contacto que un usuario no sabe como cambiar su nombre y que un administrador lo pueda hacer"
- L8 (2026-11-20, user): "Se debe añadir una sección de Contacto, donde se dejará un formulario con un título y una descripción, el administrador recibirá esas peticiones y podrá responder ahí mismo. Ejemplo: Titulo: No se cambiar mi email, descripción: ayuda no se cómo se hace --> Administrador ve esa petición, resuelve y contesta: Resuelto! --> Cierra el caso y lo marca como completado. El administrador podrá ver las peticiones de todo tipo y puede entrar a perfil de los usuarios y tener un historial ahí"
- L9 (2026-11-20): U1 verified on the local dev server: landing screenshots desktop/mobile (es, en); sign-in has no sidebar; rememberMe=false → session cookie without Max-Age, true → Max-Age=604800. Sign-out now does a full page load so no cached page keeps typed credentials (reasoned, not reproduced in a real browser).
