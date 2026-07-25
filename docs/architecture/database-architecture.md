# Database Architecture

**Status:** Implemented (Phase 1 core schema)

## Engine

PostgreSQL 16 via Docker Compose. Access through Prisma in `apps/api/prisma/schema.prisma` (worker uses the same schema package path).

## Phase 1 Models

- `User` — credentials, status, role
- `CustomerProfile` — FR-PRO fields
- `BirthProfile` — birth data + unknown-time flag
- `Role` / `Permission` / join — minimal RBAC seed

Commerce entities (Product, Order, Payment, Report, etc.) are deferred to Phase 2.

## Conventions

- UUID primary keys
- `createdAt` / `updatedAt` timestamps
- Soft concerns: `blockedAt` on user rather than hard delete initially
- Birth profiles owned by `userId`

## Related

- [schema overview](../database/schema-overview.md)
- ADR-003
