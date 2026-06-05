# TrainGrid Backend

Minimal backend scaffold for TrainGrid using TypeScript, Express, Prisma, PostgreSQL, and Redis.

## Init

```bash
corepack enable
corepack prepare pnpm@latest --activate
pnpm install
docker compose up -d
pnpm dev
```

## Available Scripts

- `pnpm dev`
- `pnpm build`
- `pnpm start`
- `pnpm typecheck`
- `pnpm db:up`
- `pnpm db:down`
- `pnpm prisma:generate`
- `pnpm prisma:migrate`
- `pnpm prisma:seed`

## Current Status

- Full folder structure scaffolded
- Health route available at `GET /health`
- Prisma and Redis clients wired
- Business routes left as placeholders for the next phase

## Chat Socket.IO

Chat realtime is available through Socket.IO on the same backend host/port.

Client auth (recommended):

```ts
const socket = io(API_URL, {
  auth: {
    token: accessToken // JWT access token from /auth
  }
});
```

Backwards-compatible auth (legacy, not recommended):

```ts
const socket = io(API_URL, {
  auth: {
    userId: "coach-or-client-id",
    role: "coach" // or "client"
  }
});
```

Socket events:

- `rooms:joined` -> initial room list after connect
- `room:join` -> join a specific room (ack supported)
- `message:send` -> send message to room (ack supported)
- `message:new` -> new message broadcast to room
- `room:updated` -> room summary update after new message
- `room:read` -> mark/read receipt sync (ack supported)
- `connection:error` -> unauthorized connection payload
