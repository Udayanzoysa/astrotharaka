# ADR-008: PayHere Notify Webhook and PDFKit Reports

## Status

Accepted

## Date

2026-07-21

## Context

Phase 2 used DEV_CONFIRM and `.txt` stub downloads. SRS requires PayHere with signature verification and branded PDF delivery. Chromium HTML-to-PDF remains desirable but PDFKit delivers reliable local PDFs without browser binaries.

## Decision

1. Integrate **PayHere sandbox/live checkout** with MD5 hash generation and `POST /api/v1/webhooks/payhere` notify verification.
2. Generate report PDFs in the worker with **PDFKit**, store under `REPORTS_DIR`, serve via authenticated download.
3. Keep `DEV_CONFIRM` for local flows without merchant credentials.

## Alternatives Considered

- Puppeteer/Chromium HTML-to-PDF only
- Client-side-only PayHere without server notify

## Consequences

### Positive

- Real PDF downloads
- Production-shaped PayHere notify path
- Local development still works without credentials

### Negative

- PDF layout is simpler than full HTML templates
- Chromium polish deferred

## Related Files

- `apps/api/src/payments/`
- `apps/worker/src/pdf-report.ts`
- `apps/web/src/app/orders/[id]/page.tsx`
