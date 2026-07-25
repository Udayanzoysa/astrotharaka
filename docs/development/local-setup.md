# Local Setup

## Prerequisites

- Node.js 20+
- pnpm 10+
- Docker Desktop (PostgreSQL, Redis, MinIO, astrology-engine)
- Python 3.12+ (optional if using Docker for the engine only)
- Git

## First-time setup

```bash
# 1. Install dependencies
pnpm install

# 2. Environment
cp .env.example .env
cp .env.example apps/api/.env
cp .env.example apps/worker/.env

# 3. Start infrastructure
docker compose up -d

# 4. Shared package + Prisma
pnpm --filter @astro/shared build
pnpm db:generate
pnpm --filter @astro/api exec prisma migrate deploy
pnpm db:seed

# 5. Run API and worker (separate terminals)
pnpm dev:api
pnpm dev:worker
```

Astrology engine is included in `docker compose` as `astrology-engine`. To run locally without Docker for the engine:

```bash
cd services/astrology-engine
python -m venv .venv
# Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001
```

## Smoke test (API)

```bash
curl http://localhost:3000/api/v1/health

curl -X POST http://localhost:3000/api/v1/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"demo@example.com\",\"password\":\"password1\",\"fullName\":\"Demo User\"}"
```

## Known environment gaps (this machine)

As of 2026-07-21 bootstrap validation: Docker and system Python were not available on PATH. Code typechecks and builds; full runtime smoke requires installing Docker Desktop (and optionally Python).
