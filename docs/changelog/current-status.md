# Current Project Status

## Last Updated

2026-07-31 (UTC+5:30)

## Current Phase

Phase 14 — Go-live readiness (production hardening)

## Currently Working On

- Deployment configuration + manual QA smoke tests before DNS cutover

## Completed Recently (Phase 14)

- Removed all `devCode` from auth API + verify-email/register UI
- Password reset email link flow (Phase 13)
- Subscription dual-payment + admin approve flow (Phase 13)
- PayHere subscription sandbox-complete gated (matches orders)
- Production config validation on API startup
- SMTP file fallback disabled in production
- Gemini local fallback disabled in production (baby names, porondam)
- Go-live wiki: `docs/wiki/go-live-readiness.md`

## In Progress

- Manual QA smoke test checklist (see go-live wiki)

## Pending (post-launch)

- Google / Facebook OAuth live credentials
- Finance email on new `PAYMENT_UNDER_REVIEW`
- SI/TA i18n for new strings
- Admin orders: user mobile column

## Blocked

- None (launch blocked only on deployment env + QA sign-off)

## Known Issues

- PayHere localhost: use sandbox-complete only in dev with `NEXT_PUBLIC_ALLOW_DEV_PAYMENTS=true`
- Prisma generate on Windows needs API/worker stopped (DLL lock)

## Next Recommended Task

1. Set production env vars (see `docs/wiki/go-live-readiness.md`)
2. Run QA smoke tests checklist
3. Deploy API + worker + web + engine

## Wiki

- [Go-live readiness](../wiki/go-live-readiness.md)
- [Recent updates & roadmap](../wiki/recent-updates-and-roadmap.md)
