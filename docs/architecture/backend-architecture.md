# Backend Architecture

**Status:** Implemented (Phase 1 scaffold)

## Runtime

- `apps/api` — NestJS HTTP API (REST)
- `apps/worker` — NestJS process consuming BullMQ jobs
- `packages/shared` — shared enums, error codes, queue names
- `services/astrology-engine` — FastAPI calculation stub (called by worker only)

## Module Boundaries (API)

| Module | Responsibility |
|--------|----------------|
| `health` | Liveness |
| `prisma` | Database client |
| `auth` | Register, login, JWT |
| `users` | Customer profile |
| `birth-profiles` | Birth data CRUD |
| `queue` | Enqueue jobs (producer) |

## Patterns

- Thin controllers; logic in services
- `ValidationPipe` on all DTOs (`class-validator`)
- Structured `AppException` + error codes from `@astro/shared`
- JWT bearer auth guard for protected routes
- Config via `@nestjs/config` and env vars

## What Must Not Run in the API Request Path

- AI provider calls
- PDF rendering
- Heavy astrology ephemeris work (delegate to engine via worker)

## Related ADRs

- ADR-001, ADR-002, ADR-003, ADR-004
