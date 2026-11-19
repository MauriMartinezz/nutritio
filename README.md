This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Local database

PostgreSQL 17 and the Adminer web client run with Docker Compose:

```bash
docker compose up -d     # start
docker compose down      # stop (data persists in the postgres-data volume)
```

- PostgreSQL: `localhost:5432`, database `nutritio`, user `nutritio` / password `nutritio`.
- Adminer: http://localhost:8080 (system `PostgreSQL`, server `postgres`, same credentials).

Defaults are dev-only; override them with `POSTGRES_*`, `POSTGRES_PORT` and `ADMINER_PORT` environment variables.

Production runs on Prisma Postgres (Vercel). Use its direct `postgres://` connection string as `DATABASE_URL`:
the app connects through `@prisma/adapter-pg`, which does not accept `prisma+postgres://` URLs.

## Prisma

Create a `.env` file (git-ignored):

```bash
DATABASE_URL="postgresql://nutritio:nutritio@localhost:5432/nutritio"
BETTER_AUTH_SECRET="<generate with: openssl rand -base64 32>"
BETTER_AUTH_URL="http://localhost:3000"
```

```bash
pnpm db:migrate    # apply migrations (prisma migrate dev)
pnpm db:generate   # generate the client into generated/prisma
pnpm db:studio     # browse data with Prisma Studio
```

Restart `pnpm dev` after `pnpm db:generate`: the dev server keeps the previous Prisma client in memory.

### Production

```bash
pnpm db:deploy   # apply pending migrations (prisma migrate deploy); never use db:migrate in production
pnpm build       # runs prisma generate, then next build (generated/ is git-ignored)
```

## Authentication and roles

[Better Auth](https://www.better-auth.com) handles email + password accounts (`lib/auth.ts`, mounted at `/api/auth/*`).

- At sign-up a person chooses **Client** or **Nutritionist**. `ADMIN` can never be chosen at sign-up.
- Nutritionists also provide DNI, professional license, date of birth, contact phone and an optional specialty, and start **pending** until an admin verifies them. After sign-up only an admin can change that data.
- Role, verification status and the professional profile cannot be changed through the auth API (`/api/auth/update-user` returns 403).
- Create the first admin from an existing account: `pnpm admin:promote <email>`. Admins verify nutritionists at `/admin`.
- Clients find verified nutritionists at `/nutritionists` and request to work with them; a client can work with several nutritionists at once.
- Nutritionists accept or decline requests at `/clients`. A nutritionist reads a client's data only while their link is accepted (`modules/coaching/dal.ts` → `requireClientAccess`).
- Server code reads the user through `modules/identity/dal.ts` (`getCurrentUser`, `requireUser`, `requireRole`).

## Food catalog (USDA FoodData Central)

The `foods` table is seeded from the USDA Foundation Foods and SR Legacy datasets
(JSON downloads from https://fdc.nal.usda.gov/download-datasets/). Values are per 100 g.

```bash
pnpm usda:download   # download and extract into data/usda (git-ignored)
pnpm usda:import     # upsert ~8,200 foods; never overwrites name_es
```

Energy falls back from `Energy` to Atwater specific/general factors; carbohydrates fall back
from "by difference" to "by summation". Missing values stay `NULL`.

### Spanish names and raw/cooked variants

`prisma/seed/food-names-es.json` is a curated list of common foods with Argentine Spanish names.
Each entry groups a food's USDA variants so the plan editor can offer a raw/cooked toggle:

```json
{ "key": "chicken-breast", "nameEs": "Pechuga de pollo", "category": "Carnes y aves", "raw": 171077, "cooked": 171477, "cookedMethodEs": "asada" }
{ "key": "avocado", "nameEs": "Palta", "category": "Frutas", "asIs": 171705 }
```

```bash
pnpm foods:names-es   # validate the file and apply it (name_es, category_es, group_key, preparation)
```

The file is the source of truth: removing an entry clears its Spanish data. Re-running `pnpm usda:import` keeps it.

## Tests

```bash
pnpm test
```
