# Frontend Architecture

**Status:** Implemented (Phase 1 customer web)

## App

- Package: `apps/web` (`@astro/web`)
- Stack: Next.js 15 App Router, React 19, TypeScript, Tailwind CSS v4
- Brand: **Taraka (තාරකා)** — system code AstroAI Lanka
- Design source: [`docs/design/Taraka_UI_Design.md`](../design/Taraka_UI_Design.md)

## Runtime

| Item | Value |
|------|--------|
| Local URL | http://localhost:3001 |
| API | `NEXT_PUBLIC_API_URL` → `http://localhost:3000/api/v1` |
| Default theme | Cosmic Night (dark) |
| Languages | `en` / `si` / `ta` |

## Screens (Phase 1)

| Route | Purpose |
|-------|---------|
| `/` | Landing + starfield hero |
| `/register` | Customer registration |
| `/login` | Login |
| `/dashboard` | Logged-in home + pillars |
| `/birth-profiles` | List |
| `/birth-profiles/new` | Create |
| `/birth-profiles/[id]` | Edit/delete |
| `/settings` | Profile settings |

## Auth

JWT access token stored in `localStorage` (`taraka_token`). Sent as `Authorization: Bearer`.

## Brand assets

- `apps/web/public/brand/taraka-mark.png`
- `apps/web/public/brand/taraka-lockup.png`
- `apps/web/public/brand/taraka-wordmark.png`
