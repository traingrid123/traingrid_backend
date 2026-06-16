# TrainGrid Backend

Express + TypeScript + Prisma + PostgreSQL + Redis + BullMQ + Socket.IO

## Quick Start

```bash
corepack enable && corepack prepare pnpm@latest --activate
pnpm install
docker compose up -d          # postgres + redis
pnpm run prisma:migrate
pnpm run dev
```

## Docker Dev (Hot Reload)

```bash
pnpm run docker:dev:up        # backend + postgres + redis, hot reload
pnpm run docker:dev:logs
pnpm run docker:dev:shell
pnpm run docker:dev:down
```

## Scripts

| Command | Description |
|---|---|
| `pnpm run dev` | Dev server with ts-node-dev |
| `pnpm run build` | Compile TypeScript |
| `pnpm run start` | Run compiled output |
| `pnpm run typecheck` | Type-check only (no emit) |
| `pnpm run db:up/down` | Start/stop Postgres+Redis via docker compose |
| `pnpm run prisma:generate` | Regenerate Prisma client |
| `pnpm run prisma:migrate` | Run migrations |
| `pnpm run prisma:seed` | Seed database |

## Architecture

```
src/
  app.ts                       # Express app setup, middleware
  server.ts                    # HTTP + Socket.IO server bootstrap
  config/env.ts                # Zod-validated environment config
  lib/prisma.ts                # Prisma client singleton
  lib/redis.ts                 # Redis client singleton
  modules/                     # Feature modules (schema → repo → service → controller → router)
    auth/                      # JWT + refresh tokens, password change
    clients/
    coaches/
    workouts/
    nutrition/
    habits/
    chat/                      # Socket.IO chat rooms
    notifications/             # DB notifications + BullMQ queue
    relationships/
    progress/
    analytics/
    exercises/                 # Local exercise library + coach custom exercises
    logs/                      # Workout logs, habit logs, nutrition logs
    marketing/                 # Coach public profile, pricing tiers, testimonials
    resources/                 # Shareable content (URL-only)
  routes/
    index.ts                   # All module routers mounted here
    externalApis.router.ts     # ExerciseDB proxy → /external/exercises
    nutritionApis.router.ts    # USDA food API proxy → /external/foods
  services/
    exerciseDB.service.ts
    usda.service.ts
    edamam.service.ts
  jobs/                        # BullMQ workers (streak, missed workout, drop-off, payment)
```

## Implemented Modules

| Module | Route prefix | Notes |
|---|---|---|
| Auth | `/auth` | JWT 15min + refresh 30d, bcrypt, change-password |
| Coaches | `/coaches` | |
| Clients | `/clients` | |
| Workouts | `/workouts` | |
| Nutrition Plans | `/nutrition` | |
| Habits | `/habits` | |
| Chat | `/chat` + Socket.IO | |
| Notifications | `/notifications` | BullMQ queue, 3 retries exponential backoff |
| Relationships | `/relationships` | |
| Progress | `/progress` | |
| Analytics | `/analytics` | |
| Exercises (local) | `/exercises` | + custom exercises per coach |
| Workout Logs | `/clients/:id/workout-logs` | |
| Habit Logs | `/clients/:id/habit-logs` | |
| Nutrition Logs | `/clients/:id/nutrition-logs` | |
| Marketing | `/marketing` | |
| Resources | `/resources` | URL-only, access control per client |
| ExerciseDB proxy | `/external/exercises` | |
| USDA food proxy | `/external/foods` | |

## Auth Endpoints

```
POST /auth/coach/register
POST /auth/coach/login
POST /auth/client/register
POST /auth/client/login
POST /auth/refresh
POST /auth/logout
POST /auth/change-password    (authenticated, any role)
GET  /auth/me
```

## Module Pattern

All modules follow: `schema.ts` (Zod validation) → `repository.ts` (Prisma queries) → `service.ts` (business logic + authz) → `controller.ts` → `router.ts`

Controllers use a local `p(req, key)` helper to cast `req.params[key]` from `string | string[]` to `string`.

## Chat — Socket.IO

```ts
const socket = io(API_URL, {
  auth: { token: accessToken }  // JWT access token
});
```

Events:
- `rooms:joined` — initial room list after connect
- `room:join` — join specific room (ack)
- `message:send` — send to room (ack)
- `message:new` — broadcast to room
- `room:updated` — room summary after new message
- `room:read` — mark/read receipt sync (ack)
- `connection:error` — unauthorized

## Key Design Decisions

- `MarketingProfileInclude` uses a typed helper function (not `as const`) — required for Prisma include type compatibility
- Logs router mounts under `/clients` prefix alongside existing clients router (both at `router.use("/clients", ...)`)
- Notification jobs: `addNotificationJob(type, payload)` in `src/modules/notifications/notificationQueue.ts`
- External API routes require `EXERCISEDB_API_KEY` and `USDA_API_KEY` in `.env` — return empty on missing key

## Known Gaps

- Google OAuth stubs return 501 — intentionally skipped
- File upload not implemented — resources store URLs only
