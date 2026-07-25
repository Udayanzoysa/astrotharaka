# Schema Overview

**ORM:** Prisma — `apps/api/prisma/schema.prisma`

## Core

| Table | Purpose |
|-------|---------|
| User | Auth identity + role |
| CustomerProfile | Customer profile (1:1 User) |
| BirthProfile | Birth data (N:1 User) |
| Role / Permission / RolePermission | RBAC seed |

## Commerce

| Table | Purpose |
|-------|---------|
| Product / ProductPrice | Catalogue + current price |
| Order | Checkout; optional `promoCode` / `promotionId` |
| Payment | PayHere / bank / DEV_CONFIRM |
| GeneratedReport | PDF metadata + file path |

## Promotions (Phase 4)

| Table | Purpose |
|-------|---------|
| Promotion | Codes (PERCENT / FIXED), limits, windows |
| PromotionRedemption | Per-order redemption (unique orderId) |
| `_ProductToPromotion` | Optional product scoping |

## Indexes (selected)

- `User.email` unique
- `Product.slug` unique
- `Promotion.code` unique
- `Order.orderNumber` unique
- `PromotionRedemption.orderId` unique
