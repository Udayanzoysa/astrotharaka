# ADR-002: NestJS and TypeScript for API and Workers

## Status

Accepted

## Date

2026-07-21

## Context

SRS §14 allows NestJS, FastAPI, or equivalent. Project coding rules require TypeScript strict mode, thin controllers, service-layer business logic, validated input, and structured errors.

## Decision

Use **NestJS** with **TypeScript strict mode** for `apps/api` and `apps/worker`.

## Alternatives Considered

- FastAPI as the primary backend (Python everywhere)
- Express or Fastify without NestJS structure

## Consequences

### Positive

- Aligns with coding standards (modules, DI, pipes, guards)
- Strong ecosystem for JWT auth, config, and BullMQ

### Negative

- Team must maintain a separate Python service for astrology calculations

## Related Files

- `apps/api`
- `apps/worker`
- `docs/development/coding-standards.md`
