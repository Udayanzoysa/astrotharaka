# AstroGuruAI Project Wiki

Permanent project knowledge base for humans and AI assistants.

**Rule:** Never rely only on chat history. Update this wiki whenever code, APIs, schema, decisions, or status change.

## Quick Start for New AI Assistants

1. Read [`handover/ai-context.md`](handover/ai-context.md)
2. Read [`changelog/current-status.md`](changelog/current-status.md)
3. Read [`handover/next-steps.md`](handover/next-steps.md)
4. Read SRS: [`AstroAI_Lanka_SRS.md`](AstroAI_Lanka_SRS.md)

## Current Reality (2026-07-31)

Phase 14 — go-live readiness. Local: API `:3005` (or `:3000`), web `:3001`.

**Launch checklist:** [Go-live readiness](wiki/go-live-readiness.md)  
**Latest updates:** [Recent updates & roadmap](wiki/recent-updates-and-roadmap.md)

## Wiki Index

### Session wiki

- [**Go-live readiness**](wiki/go-live-readiness.md) — Phase 14 checklist + QA
- [Recent updates & roadmap](wiki/recent-updates-and-roadmap.md)
- [Subscription dual-payment guide](subscription-dual-payment-implementation.md)

### Handover

- [AI context](handover/ai-context.md)
- [Implementation state](handover/current-implementation-state.md)
- [Next steps](handover/next-steps.md)
- [Warnings](handover/important-warnings.md)

### Changelog

- [Current status](changelog/current-status.md)
- [Session log](changelog/session-log.md)
- [Completed](changelog/completed-features.md)
- [Pending](changelog/pending-features.md)
- [Known issues](changelog/known-issues.md)

### Requirements / Architecture / Decisions

- [Requirements](requirements/README.md)
- [System overview](architecture/system-overview.md)
- [Backend](architecture/backend-architecture.md)
- [Database](architecture/database-architecture.md)
- [Queues](architecture/queue-and-workers.md)
- [Astrology engine](architecture/astrology-engine.md)
- [Security](architecture/security-architecture.md)
- [ADRs](decisions/README.md)

### Modules / API / Database

- [Authentication](modules/authentication.md)
- [Users](modules/users.md)
- [Birth profiles](modules/birth-profiles.md)
- [Products](modules/products.md)
- [Orders](modules/orders.md)
- [Payments](modules/payments.md)
- [Promotions](modules/promotions.md)
- [Admin](modules/admin.md)
- [AI reports](modules/ai-reports.md)
- [Notifications](modules/notifications.md)
- [API overview](api/overview.md)
- [Auth API](api/authentication-api.md)
- [Customer API](api/customer-api.md)
- [Error codes](api/error-codes.md)
- [Schema overview](database/schema-overview.md)
- [Migrations](database/migrations.md)

### Development

- [Local setup](development/local-setup.md)
- [Environment variables](development/environment-variables.md)
- [Coding standards](development/coding-standards.md)
- [Common commands](development/common-commands.md)
