# Taraka / AstroGuruAI — Recent Updates & Roadmap

**Last updated:** 2026-07-31 (UTC+5:30)  
**Audience:** Developers, admins, and AI assistants resuming work on this repo.

---

## Quick links

| Topic | Document |
|-------|----------|
| Subscription payments (full guide) | [`../subscription-dual-payment-implementation.md`](../subscription-dual-payment-implementation.md) |
| Local setup | [`../development/local-setup.md`](../development/local-setup.md) |
| Admin module | [`../modules/admin.md`](../modules/admin.md) |
| Auth API | [`../api/authentication-api.md`](../api/authentication-api.md) |
| Current status snapshot | [`../changelog/current-status.md`](../changelog/current-status.md) |
| Next steps (short list) | [`../handover/next-steps.md`](../handover/next-steps.md) |

---

## Local environment (current)

| Service | URL / port |
|---------|------------|
| Web (Next.js) | `http://localhost:3001` |
| API (NestJS) | `http://localhost:3005/api/v1` |
| PostgreSQL | `5432` |
| Redis | `6399` (memory server in dev) |

**Web env:** `NEXT_PUBLIC_API_URL=http://localhost:3005/api/v1`  
**API env:** `WEB_APP_URL=http://localhost:3001`

---

## Phase 14 — Go-live hardening (2026-07-31)

- Removed devCode from auth API and verify-email UI
- Production config validation on API boot
- PayHere sandbox paths gated; SMTP/Gemini fallbacks disabled in prod
- See [`go-live-readiness.md`](./go-live-readiness.md)

---

## What was updated (Jul 2026 sessions)

### 1. Password reset — email link flow

**Problem:** Reset password page showed `Dev code: XXXXXX` and required manual OTP entry.

**Solution:**

| Area | Change |
|------|--------|
| Email template | `buildPasswordReset()` now sends a **Reset password** button link |
| API | `forgot-password` no longer returns `devCode` |
| API | Reset link: `{WEB_APP_URL}/reset-password?email=...&code=...` |
| Web `/forgot-password` | Shows “check your email” success; no redirect with dev code |
| Web `/reset-password` | Reads `email` + `code` from URL; user only sets new password |

**Key files:**

- `packages/shared/src/email-templates.ts`
- `apps/api/src/auth/auth-challenge.service.ts`
- `apps/api/src/auth/auth.service.ts`
- `apps/web/src/app/forgot-password/page.tsx`
- `apps/web/src/app/reset-password/page.tsx`
- `apps/web/src/lib/i18n.ts`

**Note:** Email verification (`/verify-email`) may still show dev codes when `OTP_RETURN_IN_RESPONSE=true` in local dev.

---

### 2. Subscription dual-payment system

**Problem:** Subscriptions activated instantly or via manual admin assign; no PayHere / bank-slip flow like shop orders.

**Solution:** Full checkout layer mirroring product orders.

```
Customer selects package
  → POST /subscriptions/checkouts
  → POST /subscriptions/checkouts/:id/payments  (PayHere | BANK_TRANSFER)
  → Admin confirms OR PayHere webhook / sandbox-complete
  → UserSubscription ACTIVATED
```

**Database:** `SubscriptionCheckout`, `SubscriptionPayment`, `SubscriptionCheckoutStatus`  
**Migration:** `20260730113619_subscription_checkout_payments`

**Customer UI:**

- `/checkout/subscription` — PayHere or bank transfer + slip upload
- `/checkout/subscription/[id]` — status polling + PayHere return handling

**Admin UI:**

- `/admin/subscription-payments` — list (default filter: `PAYMENT_UNDER_REVIEW`)
- `/admin/subscription-payments/[id]` — review slip, approve, reject, upload slip for user

**Full implementation guide:** [`../subscription-dual-payment-implementation.md`](../subscription-dual-payment-implementation.md)

---

### 3. Shop “Failed to fetch” fix

**Cause:** API crash from circular dependency after subscription module wiring.

**Fix:**

- `subscriptions.module.ts` — `forwardRef(() => PaymentsModule)`
- `orders.module.ts` — `forwardRef(() => SubscriptionsModule)`
- `apps/web/src/lib/api.ts` — clearer network error message
- `apps/web/src/app/shop/page.tsx` — error banner

---

### 4. Admin subscription payments — user mobile

**Problem:** Admin could not see customer mobile when reviewing subscription payments.

**Solution:**

- API returns `userMobile` and `userWhatsapp` on subscription checkout list/detail
- List table shows mobile under user email
- Detail page shows Mobile / WhatsApp
- Search includes mobile and WhatsApp numbers
- **Review →** link added for pending checkouts

**Key files:**

- `apps/api/src/subscriptions/subscription-checkouts.service.ts`
- `apps/web/src/app/admin/subscription-payments/page.tsx`
- `apps/web/src/app/admin/subscription-payments/[id]/page.tsx`
- `apps/web/src/lib/types.ts`

---

### 5. Admin panel modules (earlier in same sprint)

| Module | Admin path | Purpose |
|--------|------------|---------|
| Settings | `/admin/settings` | Branding, SEO, SMTP tabs |
| Users | `/admin/users` | Auth badges, email/WhatsApp actions, bulk deactivate |
| Guests | `/admin/guest-reports` | Guest report list + outreach templates |
| Orders | `/admin/orders` | Order detail, bank slip view, report PDF |
| Subscription payments | `/admin/subscription-payments` | Bank slip review + activation |
| Bank accounts | `/admin/bank-accounts` | Display accounts for transfers |
| Products / Packages / Promotions | existing CRUD | Catalogue management |

**Public site settings:** `GET /site-settings/public` (branding + SEO for web)

---

## How admins approve subscription payments

1. Log in at `/admin/login` (roles: `CONTENT`, `SUPER_ADMIN`, `FINANCE`)
2. Open **Subscription payments** in sidebar
3. Click checkout number (e.g. `SUB-MS7GHGE8-986`) or **Review →**
4. On detail page:
   - **View bank slip** — verify amount and reference
   - **Approve & activate** — activates user subscription
   - **Reject** — cancels checkout if slip is invalid
   - **Upload slip for user** — if customer paid but did not upload

**API endpoints:**

| Action | Method | Path |
|--------|--------|------|
| List | GET | `/admin/subscription-checkouts?status=PAYMENT_UNDER_REVIEW` |
| Detail | GET | `/admin/subscription-checkouts/:id` |
| Approve | PATCH | `/admin/subscription-checkouts/:id/confirm` |
| Reject | PATCH | `/admin/subscription-checkouts/:id/reject` |
| View slip | GET | `/admin/subscription-checkouts/:id/payments/:paymentId/slip` |

**Upload storage:** `apps/api/uploads/bank-slips/` (or `BANK_SLIPS_DIR`)

---

## Where admins view uploads

| Upload type | Admin page | Action |
|-------------|------------|--------|
| Bank slip (shop order) | `/admin/orders/[id]` | View bank slip |
| Bank slip (subscription) | `/admin/subscription-payments/[id]` | View bank slip |
| Order report PDF | `/admin/orders/[id]/report` | Download PDF |
| Guest report PDF | `/admin/guest-reports/[id]` | Download PDF |

---

## What’s next — recommended plan

### Immediate (this week)

| # | Task | Why |
|---|------|-----|
| 1 | **Smoke subscription bank-transfer flow end-to-end** | User checkout → admin approve → verify active plan on dashboard |
| 2 | **Smoke PayHere sandbox for subscriptions** | Confirm webhook + `subscription-sandbox-complete` on local return |
| 3 | **Remove dev code from email verification UI** | Same pattern as password reset; hide `devCode` on `/verify-email` |
| 4 | **Set `OTP_RETURN_IN_RESPONSE=false`** in production API env | Prevent OTP leakage in API responses |
| 5 | **Extend i18n (SI/TA)** for new subscription + reset-password strings | EN keys exist; SI/TA fall back to EN today |

### Short term (next 1–2 sprints)

| # | Task | Notes |
|---|------|-------|
| 6 | **Google / Facebook OAuth credentials** | Create OAuth apps; set `GOOGLE_*` / `FACEBOOK_*`; smoke `/login` |
| 7 | **Admin orders parity** | Ensure order list shows user mobile (match subscription payments) |
| 8 | **Finance notifications** | Email admin when new `PAYMENT_UNDER_REVIEW` checkout arrives |
| 9 | **Pagination on admin tables** | Subscription payments list currently loads up to 100 rows |
| 10 | **PayHere ngrok notify** | Real webhook to localhost for full PayHere testing |

### Medium term

| # | Task | Notes |
|---|------|-------|
| 11 | North-Indian diamond kundali variant | Pending from Phase 10+ |
| 12 | WhatsApp approved templates + delivery audit | Meta Business API |
| 13 | Analytics + admin audit logs | Who approved/rejected payments |
| 14 | Mobile app | Out of scope for web sprint |

---

## Known issues / warnings

| Issue | Mitigation |
|-------|------------|
| PayHere cannot notify localhost | Use `POST /public/payments/payhere/subscription-sandbox-complete` after sandbox return |
| `OTP_RETURN_IN_RESPONSE=true` in dev | Shows dev codes on verify-email; password reset no longer affected |
| Prisma generate on Windows | Stop API/worker if DLL lock error |
| OAuth buttons without env | Redirect to login with “not configured” |
| Redis port mismatch | Dev uses `6399`; ensure API `.env` matches |

---

## Files changed summary (Jul 2026)

| Area | Main files |
|------|------------|
| Password reset | `email-templates.ts`, `auth-challenge.service.ts`, `auth.service.ts`, forgot/reset pages |
| Subscription checkout | `subscription-checkouts.service.ts`, controllers, Prisma migration |
| PayHere | `webhooks.controller.ts`, `payhere-public.controller.ts`, `payhere.service.ts` |
| Admin UI | `admin/subscription-payments/*`, `admin-sidebar.tsx` |
| Shop fix | `subscriptions.module.ts`, `orders.module.ts`, `api.ts`, `shop/page.tsx` |
| Docs | This file, `subscription-dual-payment-implementation.md` |

---

## For the next AI session

1. Read this file first
2. Then [`../changelog/current-status.md`](../changelog/current-status.md) and [`../handover/next-steps.md`](../handover/next-steps.md)
3. Run API + web locally; confirm ports `3005` / `3001`
4. If working on payments: read [`../subscription-dual-payment-implementation.md`](../subscription-dual-payment-implementation.md)
5. Update this wiki when shipping new features
