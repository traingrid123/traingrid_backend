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
