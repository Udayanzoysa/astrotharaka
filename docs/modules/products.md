# Products Module

**Status:** Implemented (Phase 2)

## Endpoints

| Method | Path | Auth |
|--------|------|------|
| GET | `/products` | Public |
| GET | `/products/:slug` | Public |

Seeded products: `basic-birth-chart`, `detailed-life-report`, `annual-forecast` (LKR prices).

## Files

- `apps/api/src/products/`
- Prisma: `Product`, `ProductPrice`
