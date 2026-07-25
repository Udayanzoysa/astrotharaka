# Common Commands

```bash
# Install
pnpm install

# Build all / shared
pnpm --filter @astro/shared build
pnpm --filter @astro/api build

# Typecheck
pnpm typecheck

# Infra
docker compose up -d
docker compose ps
docker compose logs -f astrology-engine

# Database
pnpm db:generate
pnpm --filter @astro/api exec prisma migrate deploy
pnpm db:seed
pnpm --filter @astro/api exec prisma studio

# Run
pnpm dev:api
pnpm dev:worker

# Astrology engine (local Python)
cd services/astrology-engine && uvicorn app.main:app --reload --port 8001
```
