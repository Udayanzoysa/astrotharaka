# Go-Live Readiness — Phase 14

**Last updated:** 2026-07-31  
**Status:** Production hardening complete in code — deployment config + smoke tests required before launch.

---

## Phase 14 summary

This phase removed dev-only behaviour from user-facing flows, added production startup validation on the API, and documented the launch checklist.

### Code changes (2026-07-31)

| Area | Change |
|------|--------|
| **Auth** | Removed `devCode` from register/resend API responses |
| **Verify email** | No dev code UI; email link auto-verify; inbox message after register |
| **Password reset** | Already on email link flow (prior session) |
| **PayHere subscriptions** | Sandbox-complete gated like orders (`NEXT_PUBLIC_ALLOW_DEV_PAYMENTS`) |
| **PayHere API** | `sandboxCompletePath` only returned when `PAYHERE_MODE=sandbox` |
| **Orders API** | `confirmPath` only when `ALLOW_DEV_PAYMENTS=true` |
| **Mail** | No file fallback in production — SMTP required |
| **Gemini (baby names / porondam)** | No local AI fallback in production |
| **API startup** | `validateProductionConfig()` fails fast on unsafe prod env |
| **Web env** | Centralized `getApiUrl()` + `allowDevPayments()` in `apps/web/src/lib/env.ts` |
| **`.env.example`** | Added `NEXT_PUBLIC_API_URL`, documented prod flags |

---

## Pre-launch checklist

### 1. Environment (API)

Set on production host (never use localhost values):

```env
NODE_ENV=production
JWT_ACCESS_SECRET=<random 64+ chars>
DATABASE_URL=<postgres>
REDIS_HOST=<redis>
CORS_ORIGIN=https://yourdomain.com
WEB_APP_URL=https://yourdomain.com
ASTROLOGY_ENGINE_URL=<engine url>

PAYHERE_MODE=live
PAYHERE_MERCHANT_ID=<live id>
PAYHERE_MERCHANT_SECRET=<live secret>
PAYHERE_NOTIFY_URL=https://api.yourdomain.com/api/v1/webhooks/payhere
PAYHERE_RETURN_URL=https://yourdomain.com/orders
PAYHERE_CANCEL_URL=https://yourdomain.com/orders

OTP_RETURN_IN_RESPONSE=false
ALLOW_DEV_PAYMENTS=false
ALLOW_PLACEHOLDER_CHART=false

GEMINI_API_KEY=<key>
SMTP_HOST=...
SMTP_USER=...
SMTP_PASS=...
SMTP_FROM=Taraka <info@yourdomain.com>

S3_ENDPOINT=<real s3/r2>
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
S3_BUCKET_REPORTS=...
```

### 2. Environment (Web build)

```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api/v1
NEXT_PUBLIC_ALLOW_DEV_PAYMENTS=false
```

Rebuild web after setting these (Next.js bakes public env at build time).

### 3. Database

```bash
pnpm db:generate
pnpm --filter @astro/api exec prisma migrate deploy
```

**Do not** run default seed in production with `Admin1234!`. If seeding admin, set strong `SEED_ADMIN_PASSWORD`.

### 4. Services to run

| Process | Purpose |
|---------|---------|
| API (NestJS) | REST + webhooks |
| Worker (BullMQ) | PDF generation, notifications |
| Web (Next.js) | Customer + admin UI |
| PostgreSQL | Database |
| Redis | Queue |
| Astrology engine | Swiss ephemeris charts |
| Object storage | Report PDFs |

### 5. QA smoke tests (manual)

Run these before switching DNS:

#### Auth
- [ ] Register → receive verification email → click link → dashboard
- [ ] Login with verified account
- [ ] Forgot password → email link → set new password → login
- [ ] Resend verification email works (no dev code shown)

#### Shop orders
- [ ] Browse shop → create order → PayHere live OR bank transfer
- [ ] Bank slip: admin approves at `/admin/orders/[id]`
- [ ] Report generates and downloads

#### Subscriptions
- [ ] Choose package → checkout → bank transfer + slip
- [ ] Admin approves at `/admin/subscription-payments/[id]`
- [ ] User dashboard shows active subscription

#### Admin
- [ ] Login as admin
- [ ] View bank slips (orders + subscriptions)
- [ ] User mobile visible on subscription payments
- [ ] Settings → SMTP test sends real email

#### Guest report
- [ ] Landing guest instant report works
- [ ] Admin can view guest report PDF

---

## Dev-only features (safe in local, blocked in prod)

| Feature | Local enable | Production |
|---------|--------------|------------|
| OTP in API response | `OTP_RETURN_IN_RESPONSE=true` | Always blocked |
| PayHere sandbox-complete | `NEXT_PUBLIC_ALLOW_DEV_PAYMENTS=true` | Blocked |
| DEV_CONFIRM payment | `ALLOW_DEV_PAYMENTS=true` | Blocked |
| Email file fallback | SMTP not configured | Blocked |
| Gemini local fallback | No API key | Blocked |

---

## Admin quick reference

| Task | Path |
|------|------|
| Approve subscription payment | `/admin/subscription-payments/[id]` → Approve & activate |
| Approve shop order payment | `/admin/orders/[id]` → Confirm payment |
| View bank slip | Detail page → View bank slip |
| View user mobile | Subscription payments list/detail |

---

## Known post-launch items

| Priority | Item |
|----------|------|
| High | Configure Google/Facebook OAuth for social login |
| Medium | Finance email alert on new `PAYMENT_UNDER_REVIEW` |
| Medium | Admin orders list: show user mobile (parity with subscriptions) |
| Medium | SI/TA translations for new auth/checkout strings |
| Low | OAuth token-in-URL → short-lived exchange code |
| Low | North-Indian kundali variant |
| Low | WhatsApp approved templates |

---

## Related docs

- [Recent updates & roadmap](./recent-updates-and-roadmap.md)
- [Subscription dual-payment guide](../subscription-dual-payment-implementation.md)
- [Environment variables](../development/environment-variables.md)
- [Current status](../changelog/current-status.md)
- [Next steps](../handover/next-steps.md)
