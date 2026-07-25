# Authentication API

## POST `/auth/register`

Creates a customer with `PENDING_VERIFICATION` and issues an email OTP.

**Response (Phase 8):**

```json
{
  "requiresVerification": true,
  "email": "user@example.com",
  "message": "Check your email for a verification code.",
  "user": { "...": "..." },
  "devCode": "123456"
}
```

`devCode` is included only when `OTP_RETURN_IN_RESPONSE=true` or non-production.

**Errors:** `EMAIL_ALREADY_REGISTERED`, `VALIDATION_FAILED`

## POST `/auth/login`

**Errors:** `INVALID_CREDENTIALS`, `SOCIAL_LOGIN_REQUIRED`, `USER_BLOCKED`, `EMAIL_NOT_VERIFIED`

## POST `/auth/verify-email`

Body: `{ "email", "code" }` → `{ accessToken, user }`

**Errors:** `INVALID_OTP`, `OTP_EXPIRED`

## POST `/auth/resend-otp`

Body: `{ "email" }` — always generic success (anti-enumeration). May include `devCode` in development.

## POST `/auth/forgot-password`

Body: `{ "email" }` — always generic success. Issues `PASSWORD_RESET` OTP when account exists.

## POST `/auth/reset-password`

Body: `{ "email", "code", "newPassword" }` → `{ ok: true }`

**Errors:** `INVALID_OTP`, `OTP_EXPIRED`

## GET `/auth/providers`

Returns `{ "google": boolean, "facebook": boolean }` based on env credentials.

## GET `/auth/google` · `/auth/facebook`

Starts OAuth. Callbacks redirect to `{WEB_APP_URL}/auth/callback?accessToken=…`.

If credentials are missing, redirects to `/login?error=google_not_configured` (or facebook).

## Local OTP delivery

Codes are written to `NOTIFICATIONS_DIR/otp/` (default `uploads/notifications/otp`).
