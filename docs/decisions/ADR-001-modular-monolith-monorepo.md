# ADR-001: Modular Monolith Monorepo with pnpm Workspaces

## Status

Accepted

## Date

2026-07-21

## Context

AstroAI Lanka needs a customer API, background workers, a dedicated astrology calculation service, and later web/admin clients. Starting with many microservices would slow delivery. The team needs shared types, one CI surface, and clear module boundaries.

## Decision

Use a **pnpm workspace monorepo** with a **modular monolith** NestJS API and a separate NestJS worker process sharing domain packages. Keep the astrology engine as a small dedicated Python service. Defer splitting NestJS modules into remote microservices until scale requires it.

## Alternatives Considered

- Polyrepo with independent services from day one
- Single NestJS process for both HTTP and workers
- Full microservices (API, payments, reports, notify as separate deployables)

## Consequences

### Positive

- Faster Phase 1 delivery and shared TypeScript types
- Clear path to extract services later
- One place for docs, ADRs, and conventions

### Negative

- Requires discipline to keep module boundaries clean
- Worker and API share release cadence initially

## Related Files

- `pnpm-workspace.yaml`
- `apps/api`
- `apps/worker`
- `packages/shared`
- `services/astrology-engine`
