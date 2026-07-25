# AI Context — AstroGuruAI

Concise handover for any new AI assistant or developer. Read this first.

## Project Purpose

AstroGuruAI (AstroAI Lanka) is a multilingual digital astrology platform: customers manage birth profiles, purchase report products, pay (PayHere / bank transfer), and receive AI-assisted PDF reports via queued workers, WhatsApp, and email.

**Customer brand:** Taraka (තාරකා) · **SRS:** [`docs/AstroAI_Lanka_SRS.md`](../AstroAI_Lanka_SRS.md)

## Current Technology Stack

| Layer | Choice | Status |
|-------|--------|--------|
| Monorepo | pnpm workspaces | Implemented |
| API | NestJS + TypeScript strict | Implemented |
| Worker | BullMQ + PDFKit | Implemented |
| Shared | `@astro/shared` | Implemented |
| Database | PostgreSQL + Prisma | Through Phase 4 migrations |
| Queue / cache | Redis + BullMQ | Implemented |
| Astrology | Python FastAPI stub | Implemented (Docker image) |
| Object storage | MinIO (local) | Compose service |
| Frontend | Next.js Taraka web `:3001` | Shop, orders, promo, admin list |
| Payments / AI | PayHere sandbox + PDFKit; AI stub | Sandbox local complete |

## Main Architecture

Modular monolith: `apps/api` (HTTP) + `apps/worker` (queues) + `services/astrology-engine` + Postgres/Redis/MinIO.

## Repository Structure

```text
AstroGuruAI/
├── apps/api                 # NestJS REST API
├── apps/web                 # Next.js Taraka customer UI (:3001)
├── apps/worker              # BullMQ workers + PDFKit
├── packages/shared          # Enums, error codes, queue names
├── services/astrology-engine
├── docker-compose.yml
├── .env.example
└── docs/
```

## Important Business Rules

- BR-001: No report release before payment confirmation
- BR-002/003: Birth fields required; unknown time → accuracy warning
- BR-004..006: Price/prompt/report versioning
- No AI/PDF inside HTTP handlers — queues only
- Promo limits enforced via `PromotionRedemption`

## Current Implementation Status

**Phase:** Phase 12 — Google/Facebook OAuth (complete in code)

| Area | Status |
|------|--------|
| Wiki + ADRs 001–015 | Done |
| Swiss/Lahiri engine | Done (Docker); stub fallback otherwise |
| Kundali SVG + PDF embed | Done (South-Indian) |
| Chromium HTML PDF | Done (`PDF_ENGINE` auto + PDFKit fallback) |
| Google/Facebook OAuth | Done (needs app credentials in env) |

## Migrations

1. `20260721120000_init`
2. `20260721180000_phase2_commerce`
3. `20260721190000_phase4_promotions`

## Seeded promo codes

- `WELCOME10` — 10% off, 1/customer
- `FLAT500` — LKR 500 off (min 1000)

## Local runtime notes (Windows)

- Postgres local; Redis often on **6380** (BullMQ needs Redis ≥5)
- `DATABASE_URL`: URL-encode `@` in passwords (`admin@123` → `admin%40123`)
- API `:3000`, web `:3001`, CORS includes web origin
- Commands: `pnpm dev:api`, `pnpm dev:worker`, `pnpm dev:web`

## Important File Paths

| Path | Role |
|------|------|
| `docs/AstroAI_Lanka_SRS.md` | Requirements |
| `docs/handover/ai-context.md` | This file |
| `docs/changelog/current-status.md` | Live status |
| `docs/design/Taraka_UI_Design.md` | UI design |
| `docs/modules/promotions.md` | Promo module |
| `docs/modules/admin.md` | Admin module |
| `apps/api` | NestJS API |
| `apps/worker` | BullMQ + PDF |
| `apps/web` | Taraka Next.js |

## Current Development Priorities

1. Smoke Kundali on order page + PDF
2. Chromium HTML PDFs
3. North-Indian diamond kundali / analytics

## Continuity Rules

1. Update wiki before/alongside code changes
2. Prefer ADRs for stack decisions
3. Do not commit unless user asks
4. Keep customer brand Taraka separate from system name AstroAI Lanka
