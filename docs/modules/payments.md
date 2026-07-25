# Payments

## Purpose

Online (PayHere) and bank-transfer payment flows for orders.

## Status

Phase 5 sandbox credentials configured locally; notify + sandbox-complete supported.

## PayHere

### Env

| Variable | Notes |
|----------|-------|
| `PAYHERE_MERCHANT_ID` | Sandbox merchant id |
| `PAYHERE_MERCHANT_SECRET` | Sandbox secret |
| `PAYHERE_MODE` | `sandbox` \| `live` |
| `PAYHERE_NOTIFY_URL` | Server-to-server notify (must be publicly reachable for real notify) |
| `PAYHERE_RETURN_URL` | Base customer return URL (`…/orders`; order id + `?payhere=return` appended) |
| `PAYHERE_CANCEL_URL` | Base cancel URL |

### Endpoints

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | `/api/v1/webhooks/payhere` | None | Official notify (MD5 verify) |
| POST | `/api/v1/public/payments/payhere/notify` | None | Alias notify path |
| POST | `/api/v1/public/payments/payhere/sandbox-complete` | JWT | Local sandbox only — confirms pending PayHere payment after return |

### Local testing (no ngrok)

PayHere **cannot** call `localhost`. Flow:

1. Customer clicks **PayHere sandbox** → redirect to sandbox.payhere.lk
2. After pay, browser returns to `/orders/:id?payhere=return`
3. Web calls `sandbox-complete` → order paid → PDF generation

### Real notify (optional)

1. Run ngrok against API port 3000
2. Set `PAYHERE_NOTIFY_URL=https://xxxx.ngrok.io/api/v1/webhooks/payhere`
3. Restart API; complete a sandbox payment and confirm notify hits the webhook

**Do not** use another app’s port (e.g. `:5425`) unless that process is this API.

## Bank transfer

- Creates payment `UNDER_REVIEW`
- Dev can confirm via `POST /orders/:id/payments/confirm`

## DEV_CONFIRM

Instant local confirm without gateway.
