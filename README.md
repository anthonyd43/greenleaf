# Greenleaf

A self-hostable webapp for splitting household utility bills between housemates.

- Log utility bills and group them by billing cycle. Usage periods can be
  entered as a whole month (a single month picker) or as specific start/end
  dates — whichever the bill's paperwork gives you; editing a bill
  preselects whichever mode matches its stored dates
- Compute splits automatically, with person-day proration for absences and
  personal-owner utilities (e.g. Tesla charging)
- Finalize a cycle to freeze dues, then generate Venmo payment-request links
  and track who's paid
- Imported historical cycles that were never finalized with frozen
  splits/payments show live-computed "estimated" dues instead, derived from
  each bill's free-text usage period and the current absence records — so
  old cycles still reflect prorated shares rather than a flat even split
- Dashboard with a cycle selector, stat cards, and spending/utility-breakdown
  charts
- Manage housemates, utilities, and absences from Settings/Absences, including
  a per-month absence calendar for toggling individual days someone was away
- Responsive layout (desktop sidebar / mobile bottom tabs) with a light/dark
  theme toggle (dark by default, persisted via cookie)

## Prerequisites

- Node.js 20+
- Docker (for local Postgres)
- [gitleaks](https://github.com/gitleaks/gitleaks) (`brew install gitleaks`) for secret-scanning on commit

## Setup

```bash
cp .env.example .env.local
docker run -d --name greenleaf-pg -e POSTGRES_PASSWORD=dev -p 5432:5432 postgres:16
./scripts/install-hooks.sh
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Scripts

- `npm run dev` — start the dev server
- `npm test` — run the Vitest test suite
- `npm run build` — production build
- `npm run db:push` — push the Drizzle schema to Postgres, loading `DATABASE_URL` from `.env.local` via `dotenv-cli` (added in Task 2)
- `npm run seed` — seed housemates and utilities into Postgres (added in Task 2)
- `npm run import:sheet` — one-time import of the historical spreadsheet's bills
- `npm run backfill:usage` — one-time (idempotent) data fix: derives real
  usage-start/end dates for imported bills sitting in still-open cycles, from
  their free-text usage period, so absences prorate them correctly (added in
  Task 7)

## Secrets

All secrets live in `.env.local` (never committed) and Vercel env vars. Utility
portal passwords stay in your password manager — never in this app.

## Deploy

1. Create a Neon project (free tier) and copy the pooled connection string.
2. Create a Google OAuth client and add `https://<app>.vercel.app/api/auth/callback/google` as a redirect URI.
3. Run `vercel` to create/link the Vercel project, then set these env vars in the Vercel dashboard:
   - `DATABASE_URL` (Neon pooled connection string)
   - `AUTH_SECRET` (random secret, e.g. from `openssl rand -base64 32`)
   - `AUTH_GOOGLE_ID` (OAuth client ID)
   - `AUTH_GOOGLE_SECRET` (OAuth client secret)
4. Locally, run `npm run db:push && npm run seed && npm run import:sheet` with `DATABASE_URL` pointed at Neon (temporary shell env, not committed).
5. Update real housemate emails and Venmo usernames on `/settings`.
