# Admin

## Purpose

Staff endpoints and Taraka UI for catalogue and promotion management. Roles: `CONTENT`, `SUPER_ADMIN`.

## Status

Implemented (Phase 4) — API + admin CRUD UI

## Auth

JWT + `RolesGuard`. Customer accounts cannot call these routes.

## Seeded local admin

| Email | Password | Role |
|-------|----------|------|
| `admin@taraka.local` | `Admin1234!` | CONTENT |

Created/updated by `pnpm db:seed`.

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
| `/admin` | Redirects to products |
| `/admin/products` | List + link to create/edit |
| `/admin/products/new` | Create form |
| `/admin/products/:id` | Edit form |
| `/admin/promotions` | List |
| `/admin/promotions/new` | Create form |
| `/admin/promotions/:id` | Edit form |

Header shows **Admin** when role is CONTENT or SUPER_ADMIN.
