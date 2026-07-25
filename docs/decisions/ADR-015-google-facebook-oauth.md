# ADR-015: Google + Facebook OAuth (social login)

## Status

Accepted — 2026-07-22

## Context

SRS FR-AUTH-008 calls for optional social login. Customers want one-tap Google/Facebook signup and login alongside email/password.

## Decision

1. Use Passport `google-oauth20` and `facebook` strategies on the NestJS API.
2. Routes: `GET /auth/google`, `/auth/google/callback`, `/auth/facebook`, `/auth/facebook/callback`.
3. Persist linked identities in `OAuthAccount` (`provider` + `providerUserId`); `User.passwordHash` is nullable for OAuth-only users.
4. Provider-verified email → create/link `ACTIVE` user (skip OTP) → redirect to `WEB_APP_URL/auth/callback?accessToken=…` → same JWT/`localStorage` session as password login.
5. If env credentials are missing, start routes redirect to `/login?error=*_not_configured` (buttons remain visible).
6. Matching email links the OAuth account to an existing password user (and marks verified).

## Consequences

- Requires Google Cloud OAuth client + Facebook app with email permission and correct callback URLs.
- Password login fails with `SOCIAL_LOGIN_REQUIRED` when `passwordHash` is null.
- Token briefly appears in the redirect URL query string (acceptable for local JWT SPA pattern; can move to one-time code later).
