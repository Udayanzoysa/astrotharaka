# Security Architecture

**Status:** Partial (Phase 1)

## Implemented

- Passwords hashed with bcrypt
- JWT access tokens for API auth
- Input validation on DTOs
- Structured errors without stack traces to clients in production
- Secrets via environment variables (see `.env.example`)

## Planned

- OTP email/mobile verification
- Refresh-token rotation / session revocation (FR-AUTH-007)
- Full RBAC enforcement on admin routes
- HTTPS termination at reverse proxy
- Encryption at rest for sensitive fields as required
- Payment webhook signature verification
- PII-safe logging policy enforced in code review

## Rules

- No secrets in frontend bundles
- Do not log passwords, tokens, or full payment payloads
- Limit birth data exposure to authorized roles

## Related

- ADR-002, ADR-006
- SRS §9.3 Security
