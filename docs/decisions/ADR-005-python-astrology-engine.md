# ADR-005: Dedicated Python Astrology Engine

## Status

Accepted

## Date

2026-07-21

## Context

SRS requires deterministic astrology calculations (not generative AI alone) and Swiss Ephemeris or equivalent. Python has mature ephemeris bindings. NestJS remains the orchestration layer.

## Decision

Implement `services/astrology-engine` as a **FastAPI** HTTP service. Phase 1 returns placeholder structured JSON. Later integrate Swiss Ephemeris. Workers call this service; the API does not.

## Alternatives Considered

- Pure TypeScript ephemeris in NestJS
- Embedding Swiss Ephemeris via native Node bindings only

## Consequences

### Positive

- Correct tool for astronomical calculations
- Isolates CPU-heavy work from the API

### Negative

- Extra service to deploy and version
- Requires Python toolchain for local engine development

## Related Files

- `services/astrology-engine`
- `apps/worker`
