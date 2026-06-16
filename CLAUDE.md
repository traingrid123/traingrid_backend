# TrainGrid Backend — Claude Context

## Project

Fitness coaching SaaS. Express + TypeScript + Prisma + PostgreSQL + Redis + BullMQ + Socket.IO.

Runs on port **4000**. Frontend at `traingrid_frontend` (sibling directory), port 5173.

## Stack

- Runtime: Node.js, pnpm
- Framework: Express 4
- ORM: Prisma (PostgreSQL)
- Cache/Sessions: Redis (ioredis)
- Queue: BullMQ (notifications)
- Auth: JWT (access 15min, refresh 30d stored in Redis)
- Passwords: bcryptjs
- Validation: Zod
- Real-time: Socket.IO
- Types: TypeScript strict mode

## Module Pattern

Every feature module follows this exact pattern — do not deviate:

```
src/modules/<feature>/
  <feature>.schema.ts      # Zod schemas, enums
  <feature>.repository.ts  # Prisma queries only, no business logic
  <feature>.service.ts     # Business logic, authz checks, throws <Feature>Error
  <feature>.controller.ts  # Extracts params/body, calls service, sends response
  <feature>.router.ts      # Express Router, middleware chains
```

### Controller param helper

All controllers define this at the top to handle Express's `string | string[]` params type:

```typescript
function p(req: Request, key: string): string {
  const v = req.params[key];
  return Array.isArray(v) ? v[0] : (v ?? "");
}
```

### Error classes

Each service defines `class <Feature>Error extends Error { statusCode: number }`.

## Route Registration

All routes registered in `src/routes/index.ts`. New modules must be added there.

Notable double-mount: logs and clients both mount under `/clients`:
```typescript
router.use("/clients", clientsRouter);
router.use("/clients", logsRouter);   // logs prefix includes /:clientId/...
```

## Auth

- `POST /auth/coach/register|login`
- `POST /auth/client/register|login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `POST /auth/change-password` (authenticated, any role)
- `GET /auth/me`

Dev mode: if user not found on login, account is auto-created (intentional, for local dev).

Google OAuth stubs exist but return 501 — do not implement unless asked.

## Notification Queue

```typescript
import { addNotificationJob } from '../notifications/notificationQueue';
await addNotificationJob('MISSED_WORKOUT', { coachId, clientId });
```

BullMQ queue, 3 retries, exponential backoff (5s base). Gracefully no-ops if Redis is down.

## Prisma

Key models and their unique constraints:
- `MarketingProfile` — `@@unique([coachId])`
- `WorkoutLog` — `@@unique([clientId, workoutDayId, logDate])`
- `ResourceAccess` — `@@unique([resourceId, clientId])`

`MarketingProfileInclude` must use a typed function, not `as const`:
```typescript
function buildInclude(publicOnly: boolean): Prisma.MarketingProfileInclude { ... }
```

## External APIs

- ExerciseDB proxy: `/external/exercises` — requires `EXERCISEDB_API_KEY` in `.env`
- USDA food proxy: `/external/foods` — requires `USDA_API_KEY` in `.env`

Both fail gracefully (empty arrays) if keys are missing.

## Environment Variables

Validated at startup via Zod in `src/config/env.ts`. App exits if required vars missing.
Key vars: `DATABASE_URL`, `REDIS_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `PASSWORD_SALT_ROUNDS`.

## Testing

No test suite currently. Use `pnpm run typecheck` (`tsc --noEmit`) to verify types.
Run `pnpm run dev` and hit endpoints with curl/Postman to verify.

## Known Intentional Gaps

- Google OAuth: stubs only, returns 501
- File upload: not implemented, resources store URLs only
- Workers (`src/jobs/`) exist but some job triggers may need wiring to `addNotificationJob`

## Git / Worktree Notes

Active development may happen in `.claude/worktrees/` — changes need to be merged back to main branch when complete.

Frontend lives at `/home/arnav/Documents/TrainGrid/traingrid_frontend`.
