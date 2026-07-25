# Current Project Status

## Last Updated

2026-07-22 04:15 (UTC+5:30)

## Current Phase

Phase 12 — Google + Facebook OAuth

## Currently Working On

- Phase 12 complete in code (needs Google/Facebook app credentials to fully smoke)

## Completed Recently

- Continue with Google / Facebook on login + register
- `OAuthAccount` model + nullable `passwordHash`
- OAuth callbacks → JWT session via `/auth/callback`
- ADR-015

## In Progress

- None

## Pending

- North-Indian diamond kundali variant
- WhatsApp approved templates
- Fill `GOOGLE_*` / `FACEBOOK_*` env for live social login

## Blocked

- None

## Known Issues

- Without OAuth env vars, social buttons redirect to login with “not configured”
- Prisma generate on Windows needs API/worker stopped (DLL lock)

## Next Recommended Task

- Create Google Cloud OAuth client + Facebook Login app; set callback URLs; smoke social signup
