# Next Steps

**Updated:** 2026-07-31 — Phase 14 go-live

Primary doc: [`../wiki/go-live-readiness.md`](../wiki/go-live-readiness.md)

## Before launch (required)

1. **VPS + Docker deploy** — follow [`docs/wiki/server-deployment.md`](../wiki/server-deployment.md)
2. **Namecheap DNS** — A records for `@`, `www`, `api` → server IP; SSL via `init-ssl.sh`
3. **Production env** — copy `.env.production.example` → `.env.production` (HTTPS, live PayHere, SMTP, Gemini)
4. **QA smoke tests** — auth, shop order, subscription, admin slip approval (go-live wiki)
5. **SMTP test** — Admin → Settings → send test email
6. **PayHere live** — notify URL = `https://api.astrotharaka.com/api/v1/webhooks/payhere`
7. **First backup** — `./deploy/scripts/backup.sh` and copy archive off-server

## After launch

6. Google OAuth client + Facebook Login app credentials
7. Finance email alert on `PAYMENT_UNDER_REVIEW`
8. SI/TA translations for auth + checkout strings
9. Admin orders list: show user mobile

## Later

- North-Indian kundali variant
- WhatsApp approved templates
- Admin audit log for payment approvals
