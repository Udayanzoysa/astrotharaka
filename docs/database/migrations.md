# Migrations

| Migration | Description |
|-----------|-------------|
| `20260721120000_init` | Users, profiles, birth profiles, RBAC seed tables |
| `20260721180000_phase2_commerce` | Product, ProductPrice, Order, Payment, GeneratedReport |
| `20260721190000_phase4_promotions` | Promotion, PromotionRedemption, Order promo fields |
| `20260722020000_phase8_auth_challenges` | AuthChallenge + User.emailVerifiedAt |

## Commands

```bash
# From repo root (requires Postgres)
pnpm db:migrate
pnpm db:seed
pnpm db:generate
```

Apply without prompts:

```bash
pnpm --filter @astro/api exec prisma migrate deploy
```
