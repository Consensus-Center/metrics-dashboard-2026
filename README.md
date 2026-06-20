# Consensus Center — Transparency Dashboard

A Next.js (App Router) port of the original Retool app. The dashboard renders
membership, access, operator-network, clinical-activity, and unit-economics
metrics, reading live data from the Consensus Center Postgres database (the
`cc_*` tables) and falling back to embedded constants if the API is unavailable.

## Architecture

| Retool concept | Next.js equivalent |
| --- | --- |
| Backend function `getDashboardData.ts` | [`lib/getDashboardData.ts`](lib/getDashboardData.ts) + API route [`app/api/dashboard/route.ts`](app/api/dashboard/route.ts) |
| `retoolDb.query(...)` | `pg` Pool in [`lib/db.ts`](lib/db.ts) |
| Generated hook `useGetDashboardData` | [`hooks/useGetDashboardData.ts`](hooks/useGetDashboardData.ts) (fetches `/api/dashboard`) |
| `frontend/App.tsx` | [`components/Dashboard.tsx`](components/Dashboard.tsx) |

Data flow: `Dashboard` (client) → `fetch('/api/dashboard')` → route handler →
`getDashboardData()` → `pg` Pool → Postgres. The route runs on the Node.js
runtime (`pg` is not Edge-compatible) and is marked `force-dynamic` so figures
are always live.

### Tables queried

- `cc_metrics`  — ordered by `sort_order`
- `cc_sections` — ordered by `sort_order`
- `cc_history`  — ordered by `date` (chronological timeline)
- `cc_operators`— ordered by `members_served DESC`

## Local development

Requires **Node 18.18+** (Node 22 recommended — see `.nvmrc`).

```bash
nvm use            # picks up .nvmrc (Node 22)
npm install
# .env.local already contains DATABASE_URL; edit it if your DB changes
npm run dev        # http://localhost:3000
```

The database connection string lives in `.env.local` (gitignored). See
`.env.example` for the expected shape. Use the **pooled** endpoint (host
contains `-pooler`) so it works in serverless.

## Deploy to Vercel

1. Push this repo to GitHub/GitLab/Bitbucket.
2. In Vercel, **New Project** → import the repo. Framework preset auto-detects
   **Next.js** — no build settings to change.
3. Add an environment variable:
   - `DATABASE_URL` = your pooled Postgres connection string
     (`...sslmode=require`).
4. Deploy. The `/api/dashboard` route runs as a serverless function on the
   Node.js runtime.

> Or from the CLI: `npx vercel` then `npx vercel --prod`. Add the env var with
> `npx vercel env add DATABASE_URL`.

## Project layout

```
app/
  layout.tsx              # root layout + metadata
  page.tsx                # renders <Dashboard/>
  globals.css             # minimal reset
  api/dashboard/route.ts  # GET → live dashboard JSON
components/
  Dashboard.tsx           # the full dashboard UI (client component)
hooks/
  useGetDashboardData.ts  # client fetch hook (Retool-compatible shape)
lib/
  db.ts                   # shared pg Pool
  getDashboardData.ts     # the four parallel queries
```
