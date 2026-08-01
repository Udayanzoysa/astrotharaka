# Authentication API

## POST `/auth/register`

Creates a customer with `PENDING_VERIFICATION` and sends a verification email (link + code).

**Response:**

```json
{
  "requiresVerification": true,
  "email": "user@example.com",
  "message": "Check your email for a verification link.",
  "user": { "...": "..." }
}
```

**Errors:** `EMAIL_ALREADY_REGISTERED`, `VALIDATION_FAILED`

## POST `/auth/login`

**Errors:** `INVALID_CREDENTIALS`, `SOCIAL_LOGIN_REQUIRED`, `USER_BLOCKED`, `EMAIL_NOT_VERIFIED`

## POST `/auth/verify-email`

Body: `{ "email", "code" }` → `{ accessToken, user }`

Code from email link query params or manual entry.

**Errors:** `INVALID_OTP`, `OTP_EXPIRED`

## POST `/auth/resend-otp`

Body: `{ "email" }` — always generic success (anti-enumeration). Sends new verification link.

## POST `/auth/forgot-password`

Body: `{ "email" }` — always generic success. Sends password reset link when account exists.

## POST `/auth/reset-password`

Body: `{ "email", "code", "newPassword" }` → `{ ok: true }`

Code from reset email link.

**Errors:** `INVALID_OTP`, `OTP_EXPIRED`

## GET `/auth/providers`

Returns `{ "google": boolean, "facebook": boolean }` based on env credentials.

## GET `/auth/google` · `/auth/facebook`

Starts OAuth. Callbacks redirect to `{WEB_APP_URL}/auth/callback?accessToken=…`.

If credentials are missing, redirects to `/login?error=google_not_configured` (or facebook).

## Email delivery

Production requires SMTP. In local dev without SMTP, emails may be written to `NOTIFICATIONS_DIR/email/`.

Verification link format: `{WEB_APP_URL}/verify-email?email=...&code=...`  
Reset link format: `{WEB_APP_URL}/reset-password?email=...&code=...`
