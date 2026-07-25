# Orders Module

**Status:** Implemented (Phase 2)

## Endpoints

| Method | Path | Auth |
|--------|------|------|
| POST | `/orders` | JWT |
| GET | `/orders` | JWT |
| GET | `/orders/:id` | JWT |
| POST | `/orders/:id/payments` | JWT |
| POST | `/orders/:id/payments/confirm` | JWT (dev / bank approval stub) |
| GET | `/orders/:id/report` | JWT |
| GET | `/orders/:id/report/file` | JWT download |

## Payment methods

- `DEV_CONFIRM` — immediate confirm + enqueue report (local)
- `PAYHERE` — stub checkout hints; confirm via `/payments/confirm`
- `BANK_TRANSFER` — sets `PAYMENT_UNDER_REVIEW`; confirm via `/payments/confirm`

## Business rules

- Price snapshot stored on order (BR-004)
- Report not released until payment confirmed (BR-001)
- Generation via BullMQ `report.generate` (not in HTTP handler)

## Files

- `apps/api/src/orders/`
- Prisma: `Order`, `Payment`, `GeneratedReport`
