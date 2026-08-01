# Next Steps

**Updated:** 2026-07-31 — Phase 14 go-live

Primary doc: [`../wiki/go-live-readiness.md`](../wiki/go-live-readiness.md)

## Before launch (required)

1. **Production env** — API + web build vars (HTTPS URLs, live PayHere, SMTP, Gemini, S3)
2. **Database** — `prisma migrate deploy` on production DB
3. **QA smoke tests** — auth, shop order, subscription, admin slip approval (checklist in go-live wiki)
4. **SMTP test** — Admin → Settings → send test email
5. **PayHere live** — notify URL points to `POST /api/v1/webhooks/payhere`

## After launch

6. Google OAuth client + Facebook Login app credentials
7. Finance email alert on `PAYMENT_UNDER_REVIEW`
8. SI/TA translations for auth + checkout strings
9. Admin orders list: show user mobile

## Later

- North-Indian kundali variant
- WhatsApp approved templates
- Admin audit log for payment approvals
