# ADR-007: Next.js Customer Web (Taraka)

## Status

Accepted

## Date

2026-07-21

## Context

SRS requires a customer website. Design brief for brand Taraka (තාරකා) specifies Next.js + Tailwind, Cosmic Night theme, EN/SI/TA.

## Decision

Implement customer UI in `apps/web` with Next.js 15 App Router, Tailwind v4, JWT auth against NestJS API. Run locally on port **3001**.

## Alternatives Considered

- Separate Vite React SPA
- Delay UI until catalogue APIs exist

## Consequences

### Positive

- Matches SRS §14 and design MD
- Can ship auth + birth-profile UX immediately

### Negative

- Catalogue/checkout screens must wait for Phase 2 APIs

## Related Files

- `apps/web`
- `docs/design/Taraka_UI_Design.md`
- `docs/architecture/frontend-architecture.md`
