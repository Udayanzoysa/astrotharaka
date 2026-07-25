# AstroGuruAI / Taraka (තාරකා)

AI-assisted astrology platform (system code **AstroAI Lanka**). Customer brand: **Taraka**.

## Status

Phase 1: NestJS API + BullMQ worker + Taraka Next.js customer UI (auth, birth profiles).

## Quick start

```bash
pnpm install

# Terminal 1 — API (needs Postgres + Redis 5+ on REDIS_PORT)
pnpm dev:api

# Terminal 2 — Worker
pnpm dev:worker

# Terminal 3 — Web
pnpm dev:web
```

- API: http://localhost:3000/api/v1  
- Web: http://localhost:3001  

Design: [`docs/design/Taraka_UI_Design.md`](docs/design/Taraka_UI_Design.md)

## Documentation

1. [`docs/handover/ai-context.md`](docs/handover/ai-context.md)
2. [`docs/changelog/current-status.md`](docs/changelog/current-status.md)
3. [`docs/AstroAI_Lanka_SRS.md`](docs/AstroAI_Lanka_SRS.md)

## Stack

Next.js (Taraka) · NestJS · PostgreSQL/Prisma · Redis/BullMQ · FastAPI astrology stub · pnpm monorepo
