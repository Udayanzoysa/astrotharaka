# AstroGuruAI — UI Design Technical Brief

**Audience:** UI/UX designer / design MD author  
**Product:** AstroAI Lanka / AstroGuruAI  
**Date:** 2026-07-21  
**Goal:** Design a **super-fast, simple, mobile-first customer website** that connects to the existing backend API.

Use this document to produce a design markdown (screens, flows, components, visual system). Do **not** invent admin/mobile screens unless asked — Phase 1 frontend = **customer web only**.

---

## 1. Product in one sentence

Customers register, save birth details, buy astrology report packages, pay (card/PayHere or bank transfer), then download an AI-generated PDF report in **English / Sinhala / Tamil**.

---

## 2. Frontend technical target (for implementation later)

| Item | Decision |
|------|----------|
| App | Next.js (App Router) + TypeScript |
| Styling | Tailwind CSS |
| Location in monorepo | `apps/web` (not created yet) |
| API base (local) | `http://localhost:3000/api/v1` |
| Auth | JWT Bearer token stored securely (httpOnly cookie preferred later; localStorage OK for MVP design) |
| Languages | `en`, `si`, `ta` — UI must switch language |
| Devices | Mobile-first; desktop secondary |
| Performance | Fast first paint; minimal chrome; few steps to value |

Backend is already running. Frontend is greenfield.

---

## 3. What exists in the API TODAY (design these screens first)

These endpoints are **implemented and live**. Design must support them now.

### 3.1 Conventions

- JSON in / JSON out  
- Protected routes: header `Authorization: Bearer <accessToken>`  
- Error shape:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Human readable message",
  "details": {}
}
```

### 3.2 Auth

#### `POST /auth/register` (public)

**Request**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| email | string | yes | Valid email |
| password | string | yes | Min 8 characters |
| fullName | string | yes | Min 2 |
| mobileNumber | string | no | e.g. `+94771234567` |
| preferredLanguage | `en` \| `si` \| `ta` | no | Default `en` |

**Response**

```json
{
  "accessToken": "<jwt>",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "CUSTOMER",
    "status": "ACTIVE",
    "createdAt": "ISO-8601",
    "profile": {
      "id": "uuid",
      "fullName": "Amal Perera",
      "mobileNumber": "+9477...",
      "whatsappNumber": null,
      "preferredLanguage": "en",
      "country": "LK",
      "emailMarketingConsent": false,
      "whatsappMarketingConsent": false
    }
  }
}
```

**Errors:** `EMAIL_ALREADY_REGISTERED` (409), `VALIDATION_FAILED` (400)

#### `POST /auth/login` (public)

| Field | Type | Required |
|-------|------|----------|
| email | string | yes |
| password | string | yes (min 8) |

**Response:** same shape as register (`accessToken` + `user`)  
**Errors:** `INVALID_CREDENTIALS` (401), `USER_BLOCKED` (403)

### 3.3 Profile

#### `GET /users/me` (JWT)

Returns current user + profile (same user object as above).

#### `PATCH /users/me/profile` (JWT)

Any subset of:

| Field | Type |
|-------|------|
| fullName | string |
| mobileNumber | string |
| whatsappNumber | string |
| preferredLanguage | `en` \| `si` \| `ta` |
| country | string (default `LK`) |
| emailMarketingConsent | boolean |
| whatsappMarketingConsent | boolean |

### 3.4 Birth profiles (core domain for Phase 1 UI)

#### `POST /birth-profiles` (JWT)

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| fullName | string | yes | Person’s name on chart |
| birthDate | string (ISO date) | yes | `YYYY-MM-DD` |
| birthTime | string | yes* | `HH:mm` or `HH:mm:ss` |
| unknownBirthTime | boolean | no | If `true`, birthTime not required |
| birthPlaceName | string | yes | City/place text |
| latitude | number | no | Optional map/geo |
| longitude | number | no | |
| timezone | string | no | Default `Asia/Colombo` |
| preferredLanguage | `en` \| `si` \| `ta` | no | Report language |
| notes | string | no | |

\* Required unless `unknownBirthTime: true`.

**Response includes**

- All saved fields  
- `accuracyWarning`: string or `null`  
  - When unknown birth time:  
    `"Birth time is approximate or unknown; report accuracy may be reduced."`

**UX rule (business BR-003):** If user checks “I don’t know birth time”, show a clear **accuracy warning** before save (and after save).

#### `GET /birth-profiles` (JWT) — list  
#### `GET /birth-profiles/:id` (JWT)  
#### `PATCH /birth-profiles/:id` (JWT) — same fields, all optional  
#### `DELETE /birth-profiles/:id` (JWT)

### 3.5 Health (optional for design)

`GET /health` → `{ "status": "ok", "service": "api" }`

### 3.6 Error codes designers should plan for

| Code | User-facing hint |
|------|------------------|
| VALIDATION_FAILED | Inline field errors |
| INVALID_CREDENTIALS | “Email or password is incorrect” |
| EMAIL_ALREADY_REGISTERED | “Account exists — log in instead” |
| USER_BLOCKED | “Account blocked — contact support” |
| UNAUTHORIZED | Redirect to login |
| NOT_FOUND | Empty / 404 state |
| INTERNAL_ERROR | Friendly retry message |

---

## 4. Screens to design NOW (Phase 1 customer web MVP)

Keep flows **short**. Prefer 1 primary action per screen.

| # | Screen | Purpose | API |
|---|--------|---------|-----|
| 1 | Landing / Home | Brand, value, language switch, CTA | Public (static) |
| 2 | Register | Create account | `POST /auth/register` |
| 3 | Login | Sign in | `POST /auth/login` |
| 4 | Dashboard / Home (logged in) | Next actions: add birth, view profiles | `GET /users/me` |
| 5 | Birth profile list | Manage saved births | `GET /birth-profiles` |
| 6 | Birth profile create / edit | Fast form + unknown-time warning | POST/PATCH |
| 7 | Birth profile detail | View one profile + warning badge | `GET /:id` |
| 8 | Profile settings | Name, mobile, WhatsApp, language, consents | GET/PATCH users |
| 9 | Empty / loading / error states | Global patterns | — |

**Not available in API yet — design as “coming soon” or wireframes for Phase 2 only:**

- Product catalogue & prices  
- Checkout / promo codes  
- PayHere / bank slip upload  
- Order status tracker  
- Report download / PDF viewer  
- WhatsApp delivery confirmation  
- Admin portal  

If the designer includes Phase 2 screens, mark them clearly as **Phase 2**.

---

## 5. Recommended user flows (MVP)

### Flow A — First-time user (fast path)

1. Land → choose language (en/si/ta)  
2. Register (email, password, full name)  
3. Immediately: “Add birth details”  
4. Save birth profile  
5. Success: “Profile saved” + soft CTA “Reports coming soon” (until catalogue ships)

### Flow B — Returning user

1. Login  
2. Dashboard → Birth profiles  
3. Edit / delete / add another

### Flow C — Unknown birth time

1. Toggle “I don’t know exact birth time”  
2. Show warning (non-scary, clear)  
3. Allow save without time  
4. Show warning badge on list/detail cards

---

## 6. UX principles for “super fast + user friendly”

1. **Mobile thumb zone** — primary CTA bottom / sticky where helpful  
2. **≤ 5 fields visible** before advanced/optional collapse (lat/long/notes under “More”)  
3. **Native-feeling inputs** — date picker, time picker, place autocomplete (design the UI; geo API can come later)  
4. **Instant feedback** — skeleton loaders, disabled button while submitting, success toast  
5. **Language first** — language control always visible (header)  
6. **Trust without clutter** — short disclaimer: astrology is cultural/spiritual guidance, not medical/legal advice (SRS requirement)  
7. **No dashboard soup** — avoid admin-style cards/stat grids on customer home  
8. **One hero composition** on landing — brand name dominant, one headline, one short sentence, one CTA  

---

## 7. Content & localization notes

| Language code | Label to show |
|---------------|---------------|
| en | English |
| si | සිංහල |
| ta | தமிழ் |

UI copy must support Sinhala/Tamil (allow taller lines, wrapping). Design for longer text than English.

**Sample disclaimer (EN):**  
“AstroAI Lanka provides astrology guidance for cultural, spiritual, and entertainment purposes. Reports do not guarantee outcomes and are not medical, legal, or financial advice.”

---

## 8. Visual / brand guidance for the design MD

Designers should define in the design MD:

- Brand name treatment: **AstroGuruAI** / **AstroAI Lanka** (confirm final public name)  
- Color tokens (CSS variables)  
- Type scale (expressive fonts — avoid generic Inter/Roboto-only look)  
- Spacing system  
- Button / input / alert / badge components  
- Sri Lanka–relevant atmosphere (optional imagery: lotus, temple silhouette, night sky — keep tasteful, not cartoonish)  
- Light theme recommended for trust/readability (dark optional later)

Avoid: purple-gradient SaaS clichés, noisy badge piles, card-heavy marketing heroes.

---

## 9. Phase 2 API shapes (for future screens — not live yet)

Designers can sketch these; engineers will implement APIs later.

### Planned commerce concepts

| Entity | Key fields (planned) |
|--------|----------------------|
| Product | name, description, languages, sample preview, active |
| ProductPrice | currency `LKR`, amount, snapshot at order time |
| Promotion | code, discount type/%, validity |
| Order | status, totals, birthProfileId, productId |
| Payment | method `PAYHERE` \| `BANK_TRANSFER`, status |
| GeneratedReport | version, PDF URL, language, status |

### Planned order statuses (for status UI)

`DRAFT` → `AWAITING_PAYMENT` → `PAYMENT_UNDER_REVIEW` (bank) → `PAID` → `GENERATING` → `COMPLETED` / `FAILED`

### Planned purchase flow

Select product → login → select/create birth profile → promo → pay → wait (progress) → download PDF + email/WhatsApp notice

---

## 10. Component inventory to specify in the design MD

Minimum components:

- App shell (header: logo, language, auth actions)  
- Primary / secondary / ghost buttons  
- Text input, password, select, date, time, checkbox, toggle  
- Form field + error text  
- Alert / warning banner (for unknown birth time)  
- Toast  
- Empty state  
- List row / profile card  
- Bottom sheet or modal (delete confirm)  
- Language switcher  
- Skeleton loader  

---

## 11. Screen checklist for the design MD file

Designer should produce a markdown that includes:

1. Brand & visual system  
2. Sitemap (MVP + Phase 2 marked)  
3. Wireframe notes or Figma links per screen  
4. Exact form fields mapped to API field names above  
5. Empty / error / loading / success for each form  
6. Mobile (390px) and desktop (1280px) layouts  
7. Accessibility: contrast, tap targets ≥ 44px, focus states  
8. Motion notes (subtle page/fade only — 2–3 intentional motions max)

---

## 12. Quick API cheat sheet

```text
BASE = http://localhost:3000/api/v1

POST   /auth/register
POST   /auth/login
GET    /users/me                          Authorization: Bearer <token>
PATCH  /users/me/profile                  Authorization: Bearer <token>
GET    /birth-profiles                    Authorization: Bearer <token>
POST   /birth-profiles                    Authorization: Bearer <token>
GET    /birth-profiles/:id                Authorization: Bearer <token>
PATCH  /birth-profiles/:id                Authorization: Bearer <token>
DELETE /birth-profiles/:id                Authorization: Bearer <token>
GET    /health
```

---

## 13. What to deliver back

Create a file such as:

`docs/design/AstroGuruAI_UI_Design.md`

Then tell the engineering team. We will scaffold `apps/web` (Next.js + Tailwind) and implement screen-by-screen against this API.

---

## 14. References in the repo

- Full SRS: `docs/AstroAI_Lanka_SRS.md`  
- API docs: `docs/api/`  
- Current status: `docs/changelog/current-status.md`  
- Handover: `docs/handover/ai-context.md`
