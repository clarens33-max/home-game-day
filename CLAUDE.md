# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Home Game Day** is a full-stack web app for organizing roller derby home game events. It manages pre-bout task checklists, match scheduling, rosters, on-the-day role assignments, volunteer portals, and public/guest portals. Leagues group games and members under a shared blueprint of tasks and roles.

Stack: Node.js + Express + Prisma (PostgreSQL) backend, React 19 + Vite + TanStack Query frontend. Deployed on Railway.app.

## Commands

### Development

```bash
# Install all dependencies (run from root)
npm run install:all

# Run backend (port 3001) and frontend (port 5173) separately
npm run dev:backend
npm run dev:frontend
```

### Database (run from `backend/`)

```bash
npm run db:generate   # Regenerate Prisma client after schema changes
npm run db:push       # Sync schema to DB without migration (used in production via railway.toml)
npm run db:seed       # Seed task templates, day roles, and sign checklists (idempotent)
npm run db:studio     # Open Prisma Studio at http://localhost:5555
```

### Build & Lint

```bash
npm run build:frontend   # Vite production build

cd frontend && npm run lint   # ESLint (frontend only, no autofix flag)
```

### Backend in production

```bash
cd backend && npm start   # Express on $PORT (default 3001)
```

## Environment Variables

Copy `backend/.env.example` and fill in:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Long random string for signing JWT tokens |
| `FRONTEND_URL` | Allowed CORS origin (e.g. `http://localhost:5173`) |
| `SMTP_HOST/PORT/USER/PASS/FROM` | Email for password resets |
| `PORT` | Backend port (optional, defaults to 3001) |

## Architecture

### Frontend (`frontend/src/`)

- **Routing:** React Router v7. Auth pages (`/login`, `/register`, etc.) are public. `/games/*` routes are wrapped in `RequireAuth`. Portals are public (no auth):
  - `/g/:token` — guest team portal
  - `/p/:token` — public info page
  - `/v/:token` — volunteer portal (pre-bout checklist)
  - `/otd/:token` — volunteer portal (on-the-day roles + schedule)
- **Auth:** JWT stored in localStorage, managed by `AuthContext` (`lib/auth.jsx`). Axios interceptor (`lib/api.js`) auto-attaches Bearer tokens.
- **Server state:** TanStack React Query (staleTime 30s, retry 1). Query keys follow the resource hierarchy (e.g. `['games', gameId, 'tasks']`).
- **UI:** Tailwind CSS v4. Shared components in `components/`. Page-level components in `pages/` organized by section (auth, dashboard, guest, public, volunteer, league).
- **Vite proxy:** `/api/*` requests are proxied to `http://localhost:3001` during development — no CORS issues locally.

### Backend (`backend/src/`)

- **Routes:** All under `/api/`. Groups:
  - `auth`
  - `games`, `games/:gameId/tasks`, `games/:gameId/matches`, `games/:gameId/teams`, `games/:gameId/day-roles`
  - `leagues` — league CRUD, member management, blueprint tasks/roles
  - `portal/guest`, `portal/public`
  - `portal/volunteer` — pre-bout checklist (tasks) accessed via `volunteerToken`
  - `portal/on-the-day` — on-the-day roles + schedule accessed via `onTheDayToken`
  - Health check at `/health`
- **Auth middleware:** `middleware/auth.js` validates JWT and attaches `req.user`. Game routes additionally verify the user is a GameOwner of that game.
- **Portal access:** All portals use token-based access (no JWT). Tokens are stored on the Game model.
- **Body limit:** Express is configured for 10MB JSON to support base64 waiver signature images.

### Database (Prisma + PostgreSQL)

Schema is at `backend/prisma/schema.prisma`. Key model relationships:

- `User` → `GameOwner` → `Game` (many owners per game, cascade delete)
- `Game` → `Match`, `GameTask`, `GameDayRole`, `Sign`, `RafflePrize`, `TimingBlock`, `PublicSection`
- `Team` → `Skater` (jersey color, waiver signature as base64)
- `TaskTemplate` and `DayRoleTemplate` hold seed data referenced when initializing a new game. Both have unique constraints (`name+category` and `name` respectively) — seed uses upsert on those keys.
- `League` → `LeagueMember` (role: OWNER|MEMBER, status: PENDING|ACTIVE), `BlueprintTask`, `BlueprintDayRole`, `Game[]`
- A `League` has a single `ownerId` (original creator, immutable) but ownership privileges are determined by `LeagueMember.role = OWNER`. Multiple members can be OWNER. `requireOwner` checks `LeagueMember.role` first, then falls back to `ownerId`.
- `Game.leagueId` optionally links a game to a league. When a game is created under a league with a blueprint, tasks/roles are seeded from `BlueprintTask`/`BlueprintDayRole` instead of the generic templates.

Game slugs are auto-generated as `{event-name-slug}-{uuid-prefix}` (e.g. `bbhr-march-22-a1b2`).

### Shareable tokens on Game

| Token | Portal | Route |
|---|---|---|
| `guestToken` | Guest team portal | `/g/:token` |
| `publicToken` | Public info page | `/p/:token` |
| `volunteerToken` | Pre-bout volunteer checklist | `/v/:token` |
| `onTheDayToken` | On-the-day roles + schedule | `/otd/:token` |

All tokens are UUID strings with unique constraints. They are added via `premigrate.js` using raw SQL (`gen_random_uuid()`) before `db:push` runs, so existing rows are backfilled correctly.

### Deployment (Railway)

`railway.toml` start command:
```
node src/scripts/premigrate.js && npx prisma db push --accept-data-loss && npm run db:seed && npm start
```

**`premigrate.js`** runs before every deploy and handles:
1. Adding new token columns to the `Game` table using `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` with `gen_random_uuid()` as the PostgreSQL-level default (so existing rows are backfilled).
2. Creating unique indexes for those columns if they don't exist.
3. Deduplicating `TaskTemplate` (by `name+category`) and `DayRoleTemplate` (by `name`): first re-points all foreign key references to the canonical (min id) row, then deletes all non-canonical duplicates. This is required before `db:push` can create unique indexes.

`db:seed` is idempotent — uses upsert on unique composite keys. `postinstall` in `package.json` runs `prisma generate` to ensure the Prisma client is always regenerated during Railway's build phase (which caches `node_modules`).

### League member flow

1. Any user searches for leagues from the Leagues list page and clicks "Request to Join" → creates `LeagueMember` with `status: PENDING`.
2. League owners see a badge on the Members tab and an amber banner with Approve/Reject buttons.
3. Approving sets `status: ACTIVE`. Rejecting deletes the record.
4. Owners can promote any active member to OWNER role, or demote any OWNER to MEMBER (server enforces: cannot demote the last owner).
