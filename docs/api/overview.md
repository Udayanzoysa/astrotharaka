# API Overview

**Base URL (local):** `http://localhost:3000/api/v1`

## Conventions

- JSON request/response
- Bearer JWT for protected routes
- Errors: `{ code, message, details? }` using codes from `@astro/shared`

## Implemented Route Groups

| Group | Prefix | Auth |
|-------|--------|------|
| Health | `/health` | Public |
| Auth | `/auth` | Public |
| Users | `/users` | JWT |
| Birth profiles | `/birth-profiles` | JWT |
| Products | `/products` | Public |
| Orders / payments / report | `/orders` | JWT |
| Webhooks | `/webhooks/payhere` | Public (MD5 signed) |

## Deferred

- Chromium HTML PDF templates
- Production AI provider
- Admin portal APIs
- Promotions
