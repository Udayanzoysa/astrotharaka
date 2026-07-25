# Queue and Workers

**Status:** Phase 6 — report pipeline active; notify still stubbed

## Technology

Redis + BullMQ. Producer in `apps/api`; consumers in `apps/worker`.

## Queues

| Queue name | Purpose | Behaviour |
|------------|---------|-----------|
| `astrology.calculate` | Call astrology engine | Deterministic chart via engine or local fallback |
| `report.generate` | Chart → narrative → PDF | Full pipeline; marks order COMPLETED |
| `pdf.render` | Standalone PDF render | Log stub (PDF done inside report.generate) |
| `notify.email` | Email delivery | SMTP or file transport (`report_ready`) |
| `notify.whatsapp` | WhatsApp delivery | Meta Cloud API or file transport |

## Rules

- Idempotent job payloads where possible (`jobId` / entity ids)
- Retries with backoff for transient failures
- Never process AI/PDF inside `apps/api` HTTP handlers

## Related

- ADR-004, ADR-009
- `packages/shared` queue name constants
