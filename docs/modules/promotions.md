# Promotions

## Purpose

Validate and apply promotional discount codes at order creation.

## Status

Implemented (Phase 4)

## Customer API

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | `/api/v1/promotions/validate` | JWT | Quote discount without creating order |

### Validate body

```json
{
  "code": "WELCOME10",
  "productId": "<uuid>",
  "orderAmount": 1490
}
```

### Response

```json
{
  "promotionId": "<uuid>",
  "code": "WELCOME10",
  "name": "Welcome 10% off",
  "discountAmount": 149,
  "totalAmount": 1341
}
```

## Order integration

`POST /api/v1/orders` accepts optional `promoCode`. On success:

- `Order.discountAmount`, `promoCode`, `promotionId` set
- `PromotionRedemption` row created (per-customer / global limits enforced)

## Seeded codes

| Code | Type | Value | Notes |
|------|------|-------|-------|
| `WELCOME10` | PERCENT | 10% | 1 use per customer |
| `FLAT500` | FIXED | LKR 500 | Min order LKR 1000 |

## Error codes

- `INVALID_PROMO`
- `PROMO_EXPIRED`
- `PROMO_LIMIT_REACHED`

## Admin API

See [`admin.md`](./admin.md) — `GET/POST/PATCH /api/v1/admin/promotions`
