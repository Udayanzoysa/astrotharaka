# Business Rules

**Source:** [`docs/AstroAI_Lanka_SRS.md`](../AstroAI_Lanka_SRS.md) §5

| ID | Rule | Phase 1 notes |
|----|------|----------------|
| BR-001 | Report not released until payment confirmed (except authorized free orders) | Deferred with payments |
| BR-002 | Standard report requires name, birth date/time/location, language | Enforced on birth profile fields |
| BR-003 | Unknown birth time → accuracy warning; report must indicate approximate data | `unknownBirthTime` flag on birth profile |
| BR-004 | Order stores price snapshot; later price changes do not alter past orders | Deferred |
| BR-005 | Reports store prompt version, calculation-rule version, AI model, timestamp | Deferred |
| BR-006 | Regenerated reports create new versions; no silent overwrite | Deferred |
| BR-007 | Promo code validation rules | Deferred |
| BR-008 | Refunds require authorization | Deferred |
| BR-009 | Delivery retry | Queue retries planned |
| BR-010 | Disclaimer on reports | Content deferred to PDF phase |

## Ethical Constraints (SRS §4.3)

Reports are cultural/spiritual/entertainment guidance. No medical/legal/financial advice, no guaranteed outcomes, no fear-based sales language.
