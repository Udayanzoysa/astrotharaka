# Functional Requirements (Summary)

**Source:** [`docs/AstroAI_Lanka_SRS.md`](../AstroAI_Lanka_SRS.md) §6  
**Status:** Authoritative summary — prefer the full SRS for detail.

## Phase 1 Implementation Scope

| Area | SRS IDs | Phase 1 |
|------|---------|---------|
| Auth (email/password) | FR-AUTH-001..007 | Done — register/login/logout JWT + OTP |
| Auth (social) | FR-AUTH-008 | Done — Google/Facebook OAuth (env credentials) |
| Customer profile | FR-PRO-001..005 | Partial — create/update core profile fields |
| Birth profiles | FR-BIRTH-* | Core CRUD implemented |
| Catalogue / orders / payments | FR-CAT, FR-ORD, FR-PAY | Deferred |
| Astrology / AI / PDF / notify | FR-AST..FR-EMAIL | Engine stub + queue producers/consumers only |

## Requirement Groups

- **Authentication:** register (email or mobile), OTP/link verify, login, password reset, block enforcement, logout, admin session terminate
- **Profile:** name, email, mobile, WhatsApp, language, country, communication prefs, deletion, marketing consent
- **Catalogue:** multilingual products with prices and samples
- **Birth information:** required fields, location, unknown birth time warning (BR-003)
- **Orders & checkout:** promo codes, price snapshot (BR-004), payment method selection
- **Payments:** PayHere online, bank transfer + slip review, webhooks, refunds
- **Astrology engine:** deterministic calculations, not AI-only
- **Charts:** Lagna, Navamsa, SVG/image
- **AI reports:** controlled prompts, versioning (BR-005/006), Sinhala/Tamil/English
- **PDF:** branded, queued generation
- **WhatsApp & email delivery**
- **Admin:** products, promos, prompts, support, analytics, audit

## Traceability

See SRS §17. Update implementation status in module docs as features ship.
