# ADR-010: Notification Adapters (Email + WhatsApp)

## Status

Accepted — 2026-07-22

## Context

SRS requires email and WhatsApp delivery of completed reports. Local development rarely has SMTP or Meta WhatsApp credentials. Queues `notify.email` and `notify.whatsapp` were already stubbed after Phase 6.

## Decision

1. Pluggable notifiers in the worker (`EmailNotifier`, `WhatsAppNotifier`).
2. **Email:** SMTP (nodemailer) when `SMTP_HOST` is set; otherwise file transport.
3. **WhatsApp:** Meta Cloud API when token + phone number id are set; otherwise file transport.
4. Soft-fallback to file transport on provider errors.
5. Transactional `report_ready` does not require marketing consent; WhatsApp skipped if no phone on profile.

## Consequences

- Local DEV_CONFIRM always leaves inspectable notification files.
- Production enables real delivery via env without code changes.
- Template-based WhatsApp and delivery audit tables remain future work.
