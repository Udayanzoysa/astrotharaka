# ADR-012: Swiss Ephemeris (Lahiri) in Astrology Engine

## Status

Accepted — 2026-07-22

## Context

SRS requires deterministic Swiss Ephemeris (or equivalent) calculations for Vedic-style charts. Phase 6 used a hash stub. Sri Lankan products expect sidereal (Lahiri) presentation.

## Decision

1. Integrate **pyswisseph** in `services/astrology-engine`.
2. Use **Lahiri sidereal** ayanamsa; Ascendant via `houses_ex`; planets via `calc_ut`.
3. Present houses as **whole-sign from Lagna** (stable Vedic UX).
4. If pyswisseph is missing or calculation fails, fall back to deterministic stub (`placeholder: true`).
5. Worker continues to call the engine HTTP API; local worker stub remains last-resort when the engine is down.

## Consequences

- Docker image gains `pyswisseph` (+ tzdata).
- `/health` reports `mode=swisseph|stub`.
- Hosts without Python/Docker still get stub charts via worker fallback.
