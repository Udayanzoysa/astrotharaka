# ADR-003: PostgreSQL and Prisma

## Status

Accepted

## Date

2026-07-21

## Context

The domain includes users, birth profiles, orders, payments, reports, and audit logs. SRS requires a relational database. We need migrations, type-safe queries, and transactions for money and report ownership.

## Decision

Use **PostgreSQL** as the system of record and **Prisma** as the ORM/migration tool for NestJS apps.

## Alternatives Considered

- TypeORM or Drizzle
- MongoDB as primary store

## Consequences

### Positive

- Strong relational integrity for orders and payments
- Prisma schema as living documentation
- Good TypeScript DX

### Negative

- Complex queries may need raw SQL
- Prisma schema must stay the source of truth for NestJS data access

## Related Files

- `apps/api/prisma/schema.prisma`
- `docker-compose.yml`
