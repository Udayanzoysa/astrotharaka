# Notifications

## Purpose

Deliver transactional messages when a report is ready (email + WhatsApp).

## Status

Phase 7 — adapters implemented; local file transport by default.

## Flow

```text
report.generate READY
  → enqueue notify.email + notify.whatsapp (kind=report_ready)
  → worker loads User + Order + GeneratedReport
  → EmailNotifier / WhatsAppNotifier send
```

## Providers

| Channel | Default (local) | Production-ready when env set |
|---------|-----------------|-------------------------------|
| Email | Write `.txt` under `NOTIFICATIONS_DIR/email` | `SMTP_HOST` (+ optional user/pass) via nodemailer |
| WhatsApp | Write `.txt` under `NOTIFICATIONS_DIR/whatsapp` | `WHATSAPP_TOKEN` + `WHATSAPP_PHONE_NUMBER_ID` (Meta Cloud API) |

SMTP / Meta failures soft-fall back to file transport.

## Skip rules

- Email: missing user email
- WhatsApp: missing `whatsappNumber` and `mobileNumber` on profile
- Report-ready is **transactional** (does not require marketing consent)

## Env

| Variable | Notes |
|----------|-------|
| `WEB_APP_URL` | Base for order links (default `http://localhost:3001`) |
| `NOTIFICATIONS_DIR` | File transport root (default `uploads/notifications`) |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_SECURE` / `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM` | Email SMTP |
| `WHATSAPP_TOKEN` / `WHATSAPP_PHONE_NUMBER_ID` / `WHATSAPP_API_VERSION` | Meta Cloud API |

## Files

- `apps/worker/src/notify/**`
- ADR-010

## Later

- Approved WhatsApp message templates
- Payment / delay notification kinds
- Delivery status persistence + admin redelivery UI
