# Session Log

## 2026-07-22 – Phase 12 Google/Facebook OAuth

### User Request

Add Google and Facebook sign-up buttons for easy login.

### Work Completed

- `OAuthAccount` + nullable `passwordHash`
- Passport Google/Facebook strategies + callbacks
- Login/register social buttons + `/auth/callback`
- ADR-015 + wiki

### Next Session Should

1. Add `GOOGLE_*` / `FACEBOOK_*` credentials and smoke OAuth
2. Restart API/worker after Prisma generate

---

## 2026-07-22 – Phase 11 Chromium HTML PDF

### User Request

Next phase.

### Work Completed

- Playwright Chromium HTML report renderer
- `PDF_ENGINE` auto/chromium/pdfkit with PDFKit fallback
- Inline South-Indian kundali in HTML
- ADR-014 + wiki updates

### Next Session Should

1. Smoke PDF with `engine=chromium` in worker logs
2. North-Indian diamond kundali or WhatsApp templates

---

## 2026-07-22 – Phase 10 Kundali SVG

### User Request

Next phase after Swiss Ephemeris.

### Work Completed

- South-Indian rasi SVG + PDFKit draw
- Worker writes `{order}-v{n}-kundali.svg`
- API chart.svg endpoint + Taraka preview
- ADR-013

### Next Session Should

1. Smoke kundali preview after payment
2. Chromium HTML PDFs or NI diamond chart

---

## 2026-07-22 – Phase 9 Swiss Ephemeris

### User Request

Implement next phase.

### Work Completed

- pyswisseph Lahiri calculator + stub fallback in astrology-engine
- Health mode reporting; Dockerfile/requirements updated
- Worker/PDF/narrative alignment for longitude/retrograde/system
- ADR-012 + docs

### Next Session Should

1. Build/run astrology-engine via Docker and verify `placeholder:false`
2. Kundali SVG or Chromium PDFs

---

## 2026-07-22 – Phase 8 auth OTP + password reset

### User Request

Next phase after notifications.

### Work Completed

- AuthChallenge schema/migration; email verify + password reset APIs
- Web verify/forgot/reset pages; register no longer auto-logs in
- ADR-011 + auth docs

### Next Session Should

1. Restart API after prisma generate if DLL locked
2. Smoke OTP flows in browser
3. Swiss Ephemeris or Chromium PDFs

---

## 2026-07-22 – Phase 7 notifications

### User Request

Start next phase after report pipeline.

### Work Completed

- Email/WhatsApp pluggable notifiers (file default; SMTP / Meta when configured)
- Worker handlers for `report_ready`
- ADR-010 + notifications module docs + env example

### Next Session Should

1. Smoke notification files after DEV_CONFIRM
2. Swiss Ephemeris or OTP/password reset

---

## 2026-07-22 – Phase 6 report generation pipeline

### User Request

Implement Phase 6 plan (engine + AI adapter + richer PDF).

### Work Completed

- Worker modules: astrology-client, chart builder, AI adapters, PDF layout
- Astrology engine stub 0.2 deterministic chart
- Notify email/whatsapp stub enqueue after READY
- ADR-009 + docs/status updates

### Files Changed

- `apps/worker/src/**`
- `services/astrology-engine/app/main.py`
- `packages/shared` notify payloads
- docs (ai-reports, astrology-engine, ADR-009, status)

### Next Session Should

1. Smoke PDF after DEV_CONFIRM
2. Real notifications or Swiss Ephemeris

---

## 2026-07-21 – Phase 5 PayHere sandbox credentials

### User Request

Configure PayHere sandbox merchant credentials and local notify workaround.

### Work Completed

- Applied sandbox merchant id/secret to local env files
- Order return/cancel URLs include order id + `payhere` query
- Added `sandbox-complete` + notify alias under `/public/payments/payhere`
- Order page auto-calls sandbox-complete on return
- Docs: payments, webhook-api, status

### Notes

- User’s `:5425` notify path mapped to this API on `:3000` (`/api/v1/webhooks/payhere`)
- Real notify still needs ngrok (or similar)

### Next Session Should

1. Browser smoke: PayHere sandbox checkout → PDF
2. Optional ngrok notify verification

---

## 2026-07-21 – Phase 4b admin CRUD UI

### User Request

Continue Phase 4.

### Work Completed

- Admin product create/edit forms + GET by id
- Admin promotions list/create/edit forms + GET by id
- Admin nav; `/admin` redirect
- Seed CONTENT user `admin@taraka.local` / `Admin1234!`
- Docs: admin module + status

### Files Changed

- `apps/web/src/app/admin/**`, `components/admin/**`
- `apps/api/src/admin/**`, `products.service.ts`, `prisma/seed.ts`
- docs

### Next Session Should

1. Smoke admin UI with seeded account
2. Start PayHere sandbox E2E or richer finance admin

---

## 2026-07-21 – Phase 4 promotions + admin

### User Request

Continue next phase (after PayHere/PDF).

### Work Completed

- Prisma `Promotion`, `PromotionRedemption`, order promo fields + migration
- Validate promo API; apply discount on order create + redemption row
- Admin products/promotions controllers with RolesGuard
- Seed codes `WELCOME10` / `FLAT500`
- Taraka shop promo field, order discount display, `/admin/products`
- Module docs: promotions, admin

### Files Changed

- `apps/api/prisma/schema.prisma`, migration `20260721190000_phase4_promotions`, seed
- `apps/api/src/promotions/**`, `apps/api/src/admin/**`, orders/products
- `apps/web` shop/admin/i18n/header
- `docs/modules/promotions.md`, `docs/modules/admin.md`, status/handover

### Database Changes

- Migration `20260721190000_phase4_promotions`

### API Changes

- `POST /promotions/validate`
- `GET|POST|PATCH /admin/products`
- `GET|POST|PATCH /admin/promotions`
- Order create accepts `promoCode`

### Documentation Updated

- promotions, admin, current-status, session-log, ai-context, error-codes, customer-api

### Decisions Made

- Admin roles: CONTENT + SUPER_ADMIN only (no MARKETING role)
- Minimal admin list UI; full forms deferred

### Next Session Should

1. `prisma migrate deploy` + `db:seed` if not applied
2. Promote test user to CONTENT; smoke WELCOME10 order path
3. PayHere sandbox credentials or richer admin forms

---

## 2026-07-21 – Phase 3 PayHere + PDF

### User Request

Implement next phase after shop/pay stubs.

### Work Completed

- PayHere service (checkout hash, notify verify)
- Webhook `POST /api/v1/webhooks/payhere`
- PDFKit PDF generation in worker; API serves PDF files
- Order UI auto-posts to PayHere sandbox when configured
- ADR-008 + payments/ai-reports/webhook docs

### Files Changed

- `apps/api/src/payments/**`, `apps/api/src/orders/**`
- `apps/worker/src/pdf-report.ts`, `apps/worker/src/main.ts`
- `apps/web/src/app/orders/[id]/page.tsx`
- `.env.example`, docs

### Database Changes

- None

### API Changes

- `POST /webhooks/payhere`
- Enhanced `/orders/:id/payments` checkout payload for PayHere
- Report file download returns `application/pdf` when available

### Documentation Updated

- ADR-008, payments, ai-reports, webhook-api, current-status, session-log

### Decisions Made

- PDFKit now; Chromium HTML PDF later
- Keep DEV_CONFIRM for local without merchant keys

### Known Issues

- Needs real PayHere sandbox credentials for live redirect test

### Next Steps

- Configure sandbox keys or build promo/admin features

---

## 2026-07-21 – Phase 2 Shop / Pay / Report

### User Request

Start shop / pay / PDF UI (Phase 2 APIs).

### Work Completed

- Prisma commerce models + migration `20260721180000_phase2_commerce`
- Seeded 3 products with LKR prices
- NestJS products + orders/payments/report endpoints
- Worker generates stub report text and completes order
- Taraka pages: shop, product buy, orders list/detail with stepper + download

### Files Changed

- `apps/api/prisma/**`, `apps/api/src/products/**`, `apps/api/src/orders/**`
- `apps/worker/src/main.ts`
- `apps/web/src/app/shop/**`, `apps/web/src/app/orders/**`
- `packages/shared/src/index.ts`
- `docs/modules/products.md`, `orders.md`, `payments.md`, `ai-reports.md`

### Database Changes

- Tables: Product, ProductPrice, Order, Payment, GeneratedReport + enums

### API Changes

- `GET /products`, `GET /products/:slug`
- `POST/GET /orders`, `POST /orders/:id/payments`, `POST .../confirm`
- `GET /orders/:id/report`, `GET /orders/:id/report/file`

### Documentation Updated

- Module docs, API overview, current-status, session log

### Decisions Made

- DEV_CONFIRM payment method for local end-to-end without PayHere
- Stub report as downloadable text until PDF worker exists

### Known Issues

- Not a real PDF; PayHere stub only

### Next Steps

- PayHere sandbox or Chromium PDF

---

## 2026-07-21 – Taraka Customer UI Phase 1

### User Request

Implement UI from Taraka design markdown + brand logos.

### Work Completed

- Saved design MD and brand PNGs
- Scaffolded `apps/web` (Next.js 15 + Tailwind v4) on port 3001
- Implemented landing, register/login, dashboard, birth profiles CRUD UI, settings
- Theme tokens (dark/light), EN/SI/TA strings, API client
- ADR-007 + frontend architecture docs

### Files Changed

- `apps/web/**`
- `docs/design/Taraka_UI_Design.md`
- `docs/architecture/frontend-architecture.md`
- `docs/decisions/ADR-007-nextjs-taraka-web.md`

### Database Changes

- None

### API Changes

- None (consumed existing endpoints)

### Documentation Updated

- Design, frontend architecture, ADR-007, handover/status

### Decisions Made

- Brand public name Taraka; system code AstroAI Lanka
- Web on :3001, API on :3000

### Known Issues

- Commerce screens deferred to Phase 2 APIs

### Next Steps

- Catalogue API + shop UI

---

## 2026-07-21 – Phase 1 Bootstrap from SRS


### User Request

SRS added under `docs/`; implement Phase 1 plan (ADRs, monorepo, NestJS API, worker, astrology stub).

### Work Completed

- Wrote ADR-001..006 and requirements/architecture summaries from SRS
- Initialized git repository
- Created pnpm workspace with `@astro/api`, `@astro/worker`, `@astro/shared`
- Prisma schema + `20260721120000_init` migration for users/profiles/birth profiles/RBAC
- Auth register/login JWT; users me/profile; birth-profiles CRUD
- Queue producer + BullMQ worker stub processors
- FastAPI astrology-engine stub + Dockerfile + compose service
- `pnpm` install; shared build; API typecheck and `nest build` succeeded

### Files Changed

- `apps/api/**`
- `apps/worker/**`
- `packages/shared/**`
- `services/astrology-engine/**`
- `docker-compose.yml`, `.env.example`, `pnpm-workspace.yaml`, root `package.json`
- `docs/**` (ADRs, requirements, architecture, modules, api, database, handover, changelog)

### Database Changes

- Initial migration `20260721120000_init` (User, CustomerProfile, BirthProfile, Role, Permission, RolePermission)

### API Changes

- `GET /api/v1/health`
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET /api/v1/users/me`
- `PATCH /api/v1/users/me/profile`
- `CRUD /api/v1/birth-profiles`

### Documentation Updated

- Handover, status, session log, module/API/DB docs, local setup, env vars, ADRs

### Decisions Made

- Locked stack per SRS §14 via ADR-001..006
- API-first Phase 1; UI deferred
- Birth profile create enqueues `astrology.calculate`

### Known Issues

- Docker/Python not on PATH — runtime smoke deferred
- OTP not implemented
- Astrology worker uses stub payload

### Next Steps

- Docker up + migrate + seed + smoke tests
- Product catalogue module

---

## 2026-07-21 – Initial Wiki Bootstrap

### User Request

Establish wiki-first operating model; inspect repository.

### Work Completed

- Confirmed empty workspace; created initial docs wiki

### Files Changed

- Initial `docs/**` and root `README.md`

### Database Changes

- None

### API Changes

- None

### Documentation Updated

- Initial wiki set

### Decisions Made

- Document only what exists; defer empty stubs

### Known Issues

- SRS was missing at that time (later added)

### Next Steps

- Await SRS and begin implementation
