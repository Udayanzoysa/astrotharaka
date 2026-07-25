# ADR-004: Redis and BullMQ for Background Jobs

## Status

Accepted

## Date

2026-07-21

## Context

Report generation involves astrology calculation, AI content, PDF rendering, and notifications. Project rules forbid AI and PDF work inside HTTP request handlers. Jobs must retry and be recoverable.

## Decision

Use **Redis** with **BullMQ** queues processed by `apps/worker`. Initial queues: `astrology.calculate`, `report.generate`, `pdf.render`, `notify.email`, `notify.whatsapp`.

## Alternatives Considered

- Celery (Python-centric)
- Database-polling job table only
- Inline async in API process without a queue

## Consequences

### Positive

- Matches SRS background-job requirements
- Retry, delay, and concurrency controls
- Clear API vs worker separation

### Negative

- Requires Redis in local and production environments
- Operational monitoring of queue depth is required

## Related Files

- `apps/worker`
- `apps/api/src/queue`
- `docker-compose.yml`
