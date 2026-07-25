# Acceptance Criteria

**Source:** [`docs/AstroAI_Lanka_SRS.md`](../AstroAI_Lanka_SRS.md) §15

First production release requires (among others): register/login, birth profiles, purchase + payments, astrology + charts, AI reports in selected language, PDF, secure download, email + WhatsApp, admin products/promos/prompts, auditable statuses, analytics, RBAC, disclaimer.

## Phase 1 Acceptance (This Bootstrap)

- [x] Stack ADRs accepted and documented
- [ ] `docker compose up` starts Postgres, Redis, MinIO (blocked: Docker not on PATH)
- [x] API code for `/health`, auth, birth profiles (typecheck + build verified)
- [x] Register + login + birth-profile CRUD implemented
- [x] Worker stub consumers implemented
- [x] Astrology engine stub implemented (Docker image; local Python optional)
- [x] Wiki handover updated

Runtime HTTP smoke remains pending until Docker is available.
