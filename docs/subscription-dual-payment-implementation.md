# Subscription Dual-Payment Implementation Guide

This document describes how subscription checkout supports **PayHere (sandbox)** and **bank transfer with slip upload**, including admin review and activation.

## Architecture overview

Product **orders** already had a complete dual-payment pipeline. Subscriptions previously activated instantly (dev-only) or via manual admin assign. This feature adds a **pending checkout layer** that mirrors the order payment flow:

```
Customer selects package
  → POST /subscriptions/checkouts
  → POST /subscriptions/checkouts/:id/payments  (PayHere | BANK_TRANSFER)
  → Admin confirms OR PayHere webhook / sandbox-complete
  → UserSubscription ACTIVATED
```

## Step 1 — Database schema

**File:** `apps/api/prisma/schema.prisma`

Added:

| Model / enum | Purpose |
|--------------|---------|
| `SubscriptionCheckoutStatus` | `AWAITING_PAYMENT`, `PAYMENT_UNDER_REVIEW`, `PAID`, `ACTIVATED`, `CANCELLED` |
| `SubscriptionCheckout` | Pending purchase before subscription is active |
| `SubscriptionPayment` | PayHere or bank-transfer attempt linked to a checkout |

**Migration:** `apps/api/prisma/migrations/20260730113619_subscription_checkout_payments/migration.sql`

Run locally:

```bash
pnpm db:generate
pnpm --filter @astro/api exec prisma migrate deploy
```

## Step 2 — Backend services

### Subscription checkout service

**File:** `apps/api/src/subscriptions/subscription-checkouts.service.ts`

Reuses patterns from `apps/api/src/orders/orders.service.ts`:

- `createCheckout()` — creates pending checkout (reuses existing pending if any)
- `startPayment()` — accepts `StartPaymentDto` from orders (slip base64, provider ref, bank account)
- `confirmPayHereWebhook()` — activates after PayHere success
- `adminConfirm()` / `adminReject()` — finance review
- `adminSubmitBankPayment()` — staff uploads slip on behalf of user

Bank slip storage reuses `apps/api/src/orders/bank-slip-storage.ts`.

### Customer API

**File:** `apps/api/src/subscriptions/subscription-checkouts.controller.ts`

| Method | Path | Description |
|--------|------|-------------|
| POST | `/subscriptions/checkouts` | Create checkout `{ packageId }` |
| GET | `/subscriptions/checkouts/:id` | Checkout status |
| POST | `/subscriptions/checkouts/:id/payments` | Start PayHere or bank transfer |

### Admin API

**File:** `apps/api/src/admin/admin-subscription-checkouts.controller.ts`

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| GET | `/admin/subscription-checkouts` | CONTENT, SUPER_ADMIN, FINANCE | List (filter by status, search) |
| POST | `/admin/subscription-checkouts` | same | Create checkout for user `{ userId, packageId }` |
| GET | `/admin/subscription-checkouts/:id` | same | Detail |
| PATCH | `/admin/subscription-checkouts/:id/confirm` | same | Approve → activate subscription |
| PATCH | `/admin/subscription-checkouts/:id/reject` | same | Reject payment |
| POST | `/admin/subscription-checkouts/:id/payments` | same | Admin slip upload for user |
| GET | `/admin/subscription-checkouts/:id/payments/:paymentId/slip` | same | View slip file |

### PayHere integration

**Modified files:**

- `apps/api/src/payments/payhere.service.ts` — optional `returnPath` / `cancelPath` for subscription return URLs
- `apps/api/src/payments/webhooks.controller.ts` — routes PayHere `order_id` to order **or** subscription checkout
- `apps/api/src/payments/payhere-public.controller.ts` — `POST /public/payments/payhere/subscription-sandbox-complete`

PayHere uses the **checkout UUID** as `order_id` (same pattern as product orders).

### Module wiring

**Modified files:**

- `apps/api/src/subscriptions/subscriptions.module.ts` — registers checkout controller + service
- `apps/api/src/admin/admin.module.ts` — admin subscription checkouts controller
- `apps/api/src/payments/payments.module.ts` — imports `SubscriptionsModule` for webhooks

## Step 3 — Frontend customer checkout

### Payment selection + bank form

**File:** `apps/web/src/app/checkout/subscription/page.tsx`

- Radio: PayHere vs Bank transfer
- **PayHere:** creates checkout → starts payment → redirects to PayHere sandbox
- **Bank transfer:** bank account selector, reference number, slip file upload (PDF/image)

### Checkout status page

**File:** `apps/web/src/app/checkout/subscription/[id]/page.tsx`

- Polls checkout status
- Handles PayHere return (`?payhere=return`) via sandbox-complete endpoint
- Shows activation / under-review states

### Types & i18n

**Files:**

- `apps/web/src/lib/types.ts` — `SubscriptionCheckout` type
- `apps/web/src/lib/i18n.ts` — new checkout strings (EN; extend SI/TA as needed)

## Step 4 — Admin UI

### List pending payments

**File:** `apps/web/src/app/admin/subscription-payments/page.tsx`

- Filter by status (default: `PAYMENT_UNDER_REVIEW`)
- Search by checkout number, email, name

### Review detail + actions

**File:** `apps/web/src/app/admin/subscription-payments/[id]/page.tsx`

- View payment method, reference, bank slip
- **Approve & activate** — calls confirm endpoint
- **Reject** — cancels checkout
- **Upload slip for user** — admin submits bank transfer on behalf of customer

### Navigation

**File:** `apps/web/src/components/admin/admin-sidebar.tsx`

- New link: **Subscription payments** (CONTENT, SUPER_ADMIN, FINANCE)

## Step 5 — Environment variables

Uses existing PayHere and bank settings from `.env`:

```env
PAYHERE_MODE=sandbox
PAYHERE_MERCHANT_ID=...
PAYHERE_MERCHANT_SECRET=...
PAYHERE_NOTIFY_URL=http://localhost:3005/api/v1/webhooks/payhere
WEB_APP_URL=http://localhost:3001
```

For local PayHere sandbox, the web app calls `subscription-sandbox-complete` after return (PayHere cannot notify localhost).

## Step 6 — Testing checklist

1. **PayHere sandbox**
   - `/subscription` → choose plan → PayHere → complete sandbox payment → subscription active
2. **Bank transfer**
   - Upload slip + reference → status `PAYMENT_UNDER_REVIEW`
   - Admin → Subscription payments → Approve → user has active plan
3. **Admin slip upload**
   - Create checkout for user (API or customer starts checkout)
   - Admin uploads slip on detail page → approve
4. **Reject flow**
   - Admin rejects → checkout `CANCELLED`, user can start new checkout

## Files changed (summary)

| Area | Files |
|------|-------|
| Schema | `apps/api/prisma/schema.prisma`, migration folder |
| API core | `subscription-checkouts.service.ts`, `subscription-checkouts.controller.ts` |
| Admin API | `admin-subscription-checkouts.controller.ts` |
| PayHere | `payhere.service.ts`, `webhooks.controller.ts`, `payhere-public.controller.ts` |
| Modules | `subscriptions.module.ts`, `admin.module.ts`, `payments.module.ts` |
| Web checkout | `checkout/subscription/page.tsx`, `checkout/subscription/[id]/page.tsx` |
| Admin UI | `admin/subscription-payments/page.tsx`, `admin/subscription-payments/[id]/page.tsx` |
| Shared UI | `admin-sidebar.tsx`, `types.ts`, `i18n.ts` |

## Related documentation

- Order payment flow: `docs/modules/payments.md`, `docs/modules/orders.md`
- ADR payments: `docs/decisions/ADR-006-payments-ai-storage.md`, `ADR-008-payhere-pdfkit.md`
