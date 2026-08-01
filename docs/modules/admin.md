# Admin

## Purpose

Staff endpoints and Taraka UI for catalogue, users, orders, subscriptions, and finance review.

**Roles:** `CONTENT`, `SUPER_ADMIN`, `SUPPORT`, `FINANCE` (varies by section)

## Status

Implemented — API + admin CRUD UI, subscription payment review, settings, users, guests

## Auth

JWT + `RolesGuard`. Customer accounts cannot call these routes.

## Seeded local admin

| Email | Password | Role |
|-------|----------|------|
| `admin@taraka.local` | `Admin1234!` | CONTENT |

Created/updated by `pnpm db:seed`.

## Admin web routes

| Path | Purpose | Roles |
|------|---------|-------|
| `/admin` | Dashboard | all admin |
| `/admin/orders` | Order list + detail, bank slip, report PDF | CONTENT, SUPER_ADMIN, SUPPORT, FINANCE |
| `/admin/subscription-payments` | Subscription checkout review + approve | CONTENT, SUPER_ADMIN, FINANCE |
| `/admin/guest-reports` | Guest leads + report PDF | CONTENT, SUPER_ADMIN, SUPPORT |
| `/admin/users` | User management, outreach | CONTENT, SUPER_ADMIN, SUPPORT |
| `/admin/products` | Product CRUD | CONTENT, SUPER_ADMIN |
| `/admin/packages` | Subscription package CRUD | CONTENT, SUPER_ADMIN |
| `/admin/promotions` | Promo codes | CONTENT, SUPER_ADMIN |
| `/admin/bank-accounts` | Bank account display | CONTENT, SUPER_ADMIN, FINANCE |
| `/admin/settings` | Branding, SEO, SMTP | CONTENT, SUPER_ADMIN |

### Approve subscription payment

1. `/admin/subscription-payments` (filter: `PAYMENT_UNDER_REVIEW`)
2. Click checkout → **View bank slip** → **Approve & activate**

See [`../wiki/recent-updates-and-roadmap.md`](../wiki/recent-updates-and-roadmap.md) for full admin upload locations.

## Products API

| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/v1/admin/products` | All products (incl. inactive) |
| GET | `/api/v1/admin/products/:id` | One product |
| POST | `/api/v1/admin/products` | Create product + current price |
| PATCH | `/api/v1/admin/products/:id` | Update; rotates current price |

## Promotions API

| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/v1/admin/promotions` | List |
| GET | `/api/v1/admin/promotions/:id` | One |
| POST | `/api/v1/admin/promotions` | Create |
| PATCH | `/api/v1/admin/promotions/:id` | Update |

## Web UI

| Path | Purpose |
|------|---------|
| `/admin` | Dashboard |
| `/admin/products` | List + link to create/edit |
| `/admin/products/new` | Create form |
| `/admin/products/:id` | Edit form |
| `/admin/promotions` | List |
| `/admin/promotions/new` | Create form |
| `/admin/promotions/:id` | Edit form |
| `/admin/subscription-payments` | Subscription payment review |
| `/admin/subscription-payments/:id` | Approve / reject / view slip |

Header shows **Admin** when role is CONTENT or SUPER_ADMIN.
