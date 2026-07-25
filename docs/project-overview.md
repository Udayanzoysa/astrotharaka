# Project Overview

## Product Name

**AstroGuruAI** (also referenced in planning docs as **AstroAI Lanka**)

## Purpose

Build a digital astrology platform that lets customers purchase AI-generated astrology reports based on birth profiles, with payment processing, asynchronous report generation (astrology engine + AI + PDF), delivery, admin management, and operational recovery workflows.

> **Source of truth for requirements:** The authoritative SRS and system architecture documents were expected at the repository root but are **not present**. Scope below is inferred from the mandated wiki structure and engineering rules. It must be replaced or refined when `AstroAI_Lanka_SRS.md` and `AstroAI_Lanka_System_Architecture_and_Design.md` are supplied.

## Inferred Product Capabilities (Planned)

| Area | Description | Status |
|------|-------------|--------|
| Authentication | Customer and admin sign-in / identity | Planned |
| Users | Customer accounts and profiles | Planned |
| Birth profiles | Birth date/time/place data for chart calculation | Planned |
| Products & pricing | Sellable report products and pricing rules | Planned |
| Promotions | Discounts / promo codes | Planned |
| Orders & payments | Purchase flow, payment gateway, idempotency | Planned |
| Astrology engine | Chart / calculation engine (likely separate service) | Planned |
| AI reports | LLM-generated interpretive report content | Planned |
| PDF generation | Render reports to downloadable PDFs via workers | Planned |
| Notifications | Email / other delivery channels | Planned |
| Admin | Back-office management | Planned |
| Analytics & audit | Metrics and audit logging | Planned |

## Non-Goals (Until Confirmed)

- Do not invent unimplemented APIs, schemas, or UI as “done”
- Do not call AI or render PDFs inside synchronous HTTP request handlers (engineering rule)
- Do not expose secrets to frontend clients

## Stakeholders

| Role | Interest |
|------|----------|
| End customers | Buy and receive astrology reports |
| Admins | Manage products, orders, failed jobs, refunds |
| Developers / AI assistants | Implement and operate the system using this wiki |

## Repository State

As of **2026-07-21**:

- Workspace path: `d:\Personal\Projects\AstroGuruAI`
- **No application source code**
- **No git repository**
- **No package manifests** (`package.json`, etc.)
- **No environment samples**
- **No database migrations**
- Wiki bootstrap exists under `docs/`

## Related Documents

- [AI context](handover/ai-context.md)
- [System overview (planned)](architecture/system-overview.md)
- [Pending features / roadmap](changelog/pending-features.md)
- [Next steps](handover/next-steps.md)
