# Authentication

## Status

Phase 12 — email/password + OTP + Google/Facebook OAuth

## Flows

1. **Register** → `PENDING_VERIFICATION` → OTP → **Verify** → `ACTIVE` + JWT
2. **Login** blocked until verified (`EMAIL_NOT_VERIFIED`)
3. **Forgot password** → OTP → **Reset password**
4. **Google / Facebook** → OAuth redirect → upsert/link user → `/auth/callback?accessToken=` → dashboard

## Models

- `User.emailVerifiedAt`, nullable `passwordHash` (OAuth-only)
- `AuthChallenge` (`EMAIL_VERIFY` | `PASSWORD_RESET`)
- `OAuthAccount` (`GOOGLE` | `FACEBOOK` + `providerUserId`)

## API

| Method | Path | Notes |
|--------|------|-------|
| GET | `/auth/providers` | `{ google, facebook }` booleans |
| GET | `/auth/google` | Starts Google OAuth |
| GET | `/auth/google/callback` | Completes + redirects to web |
| GET | `/auth/facebook` | Starts Facebook OAuth |
| GET | `/auth/facebook/callback` | Completes + redirects to web |

## Web

- `/login`, `/register` — Continue with Google / Facebook
- `/auth/callback` — stores JWT
- `/verify-email`, `/forgot-password`, `/reset-password`

## Env

```
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:3000/api/v1/auth/google/callback
FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=
FACEBOOK_CALLBACK_URL=http://localhost:3000/api/v1/auth/facebook/callback
WEB_APP_URL=http://localhost:3001
```

## Related

- Migrations: `20260722020000_phase8_auth_challenges`, `20260722040000_phase12_oauth_accounts`
- ADR-011, ADR-015
