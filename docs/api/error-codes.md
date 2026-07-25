# API Error Codes

| Code | HTTP | Meaning |
|------|------|---------|
| `VALIDATION_FAILED` | 400 | Invalid or query validation failed |
| `UNAUTHORIZED` | 401 | Missing/invalid token |
| `INVALID_CREDENTIALS` | 401 | Bad email/password |
| `FORBIDDEN` | 403 | Not allowed |
| `USER_BLOCKED` | 403 | Account blocked |
| `NOT_FOUND` | 404 | Resource missing |
| `CONFLICT` | 409 | Conflict |
| `EMAIL_ALREADY_REGISTERED` | 409 | Email taken |
| `EMAIL_NOT_VERIFIED` | 403 | Login before OTP verify |
| `INVALID_OTP` | 400 | Bad OTP / reset code |
| `OTP_EXPIRED` | 400 | OTP past TTL |
| `PAYMENT_REQUIRED` | 402 | Payment needed |
| `INVALID_ORDER_STATE` | 400 | Illegal order transition |
| `REPORT_NOT_READY` | 409 | Report not ready to download |
| `INVALID_PROMO` | 400 | Bad / ineligible promo code |
| `PROMO_EXPIRED` | 400 | Promo not yet active or expired |
| `PROMO_LIMIT_REACHED` | 400 | Global or per-customer limit |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

Source: `packages/shared/src/index.ts`
