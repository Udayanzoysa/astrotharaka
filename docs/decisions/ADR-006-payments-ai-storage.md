# ADR-006: Payments, AI Providers, and Object Storage

## Status

Accepted

## Date

2026-07-21

## Context

SRS specifies PayHere (or approved gateway) plus bank transfer, OpenAI/Gemini with abstraction, and cloud object storage for PDFs and payment slips.

## Decision

- **Payments:** PayHere for online payments; manual bank-transfer verification for slips. Integrate behind a payment adapter interface (implementation in Phase 2+).
- **AI:** Provider abstraction supporting OpenAI and Google Gemini; no provider calls from HTTP handlers.
- **Storage:** S3-compatible API; **MinIO** for local development; production target Amazon S3 or Cloudflare R2.

## Alternatives Considered

- Single AI vendor hard-coded
- Local filesystem only for report storage
- Card gateway other than PayHere as primary (may add later)

## Consequences

### Positive

- Matches Sri Lankan payment reality and SRS
- Local MinIO enables PDF/slip testing without cloud accounts
- AI provider can be swapped without rewriting workers

### Negative

- Adapter interfaces must be designed before deep integrations
- Phase 1 will only stub these integrations

## Related Files

- `docker-compose.yml`
- `.env.example`
- Future: `apps/api` payment module, `apps/worker` AI/PDF processors
