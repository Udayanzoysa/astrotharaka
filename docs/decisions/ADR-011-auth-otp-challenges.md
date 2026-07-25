# ADR-011: Email OTP Challenges for Verify and Password Reset

## Status

Accepted — 2026-07-22

## Context

SRS requires email/mobile verification via OTP or link, plus password recovery. Local environments often lack SMTP.

## Decision

1. Store hashed OTPs in `AuthChallenge` with TTL and attempt limits.
2. New registrations start as `PENDING_VERIFICATION` until OTP verify.
3. Deliver codes by writing to `NOTIFICATIONS_DIR/otp` (and optionally return `devCode` outside production).
4. Forgot/reset password uses the same challenge table with purpose `PASSWORD_RESET`.
5. Anti-enumeration: forgot/resend always return generic success payloads.

## Consequences

- Existing ACTIVE users are backfilled with `emailVerifiedAt` via migration.
- Seeded admin remains ACTIVE and verified.
- SMTP can later replace file delivery without schema changes.
