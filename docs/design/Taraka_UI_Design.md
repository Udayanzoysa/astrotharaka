# Taraka (තාරකා) — UI/UX Design Technical Brief

## 1. Project Overview & Concept
**Project Name:** Taraka (තාරකා) — *System Code: AstroAI Lanka*
**English Slogan:** Navigating a destiny through the air mass.
**Sinhala Slogan:** තාරකා විශ්වය හරහා ඔබගේ අනාගතය කරා මග පෙන්වීම.
**Core Theme:** Celestial guidance, night skies, shining stars, cosmic energy, and destiny navigation.
**Goal:** Design a super-fast, simple, mobile-first customer web application connecting to the existing backend API. The UI must support seamless transitions between English, Sinhala, and Tamil (`en`, `si`, `ta`).

## 2. Design System & Theme Tokens (Light & Dark)
The application defaults to the immersive Dark theme but fully supports a Light theme for accessibility and preference. Use Tailwind CSS variables (`bg-primary`, `text-accent`, etc.).

### Dark Theme (Cosmic Night)
| Token Name | Hex Code | Usage |
| :--- | :--- | :--- |
| **Deep Space Black** | `#0B0F19` | Primary Background |
| **Cosmic Navy** | `#131B2E` | Secondary/Cards Background (80% opacity for glassmorphism) |
| **Starlight Gold** | `#F3E5AB` | Primary Accent / Highlights / Main CTA |
| **Aether Cyan** | `#00F0FF` | Interactive hover states / Glow Effects |
| **Pure Stardust** | `#FFFFFF` | Primary Typography |
| **Muted Nebula** | `#8A99AD` | Secondary Typography / Soft borders |

### Light Theme (Serene Dawn)
| Token Name | Hex Code | Usage |
| :--- | :--- | :--- |
| **Morning Sky** | `#F8FAFC` | Primary Background |
| **Cloud White** | `#FFFFFF` | Secondary/Cards Background |
| **Sunlight Gold** | `#D4AF37` | Primary Accent / Main CTA |
| **Aether Blue** | `#007B8A` | Interactive hover states / Focus rings |
| **Deep Space Black** | `#0B0F19` | Primary Typography (High Contrast) |
| **Atmosphere Gray** | `#475569` | Secondary Typography |

## 3. Typography
*   **Headings (EN):** *Cinzel* for hero/display typography to evoke a celestial feel, paired with *Poppins* for functional UI headings.
*   **Body Text (EN):** *Inter* (Clean sans-serif for optimal readability).
*   **Sinhala Text (SI):** *Noto Sans Sinhala*. Ensure increased `line-height` (e.g., `leading-relaxed`) to accommodate Sinhala script modifiers.

## 4. Component Inventory (Tailwind Ready)

1.  **Navigation (Glassmorphism):** Semi-transparent background with a subtle backdrop blur (`backdrop-blur-md`). Glowing bottom border on Dark mode. Includes Logo, Language Toggle, and Auth CTA.
2.  **Buttons:**
    *   *Primary:* Solid Starlight Gold background, Deep Space Black text. Soft cyan glow on hover (`hover:shadow-[0_0_20px_rgba(0,240,255,0.2)]`).
    *   *Secondary/Ghost:* Transparent with thin Aether Cyan border.
3.  **Cards:** Floating glass cards (`bg-cosmic-navy/80` in dark mode, `bg-white` in light mode). Thin glowing borders on hover.
4.  **Forms (Native-feel):** Inputs with floating labels. Focus state utilizes Aether Cyan/Blue ring. Skeleton loaders for async submissions.
5.  **Alerts:** Specialized non-scary "Warning Banner" specifically for the Unknown Birth Time state.

## 5. Screen Specifications (Phase 1 MVP)

### Mobile-First Layout
*   **Mobile Base:** 390px width. Primary CTAs must be fixed at the bottom (thumb zone).
*   **Desktop Base:** 1280px width. Use max-width containers (`max-w-7xl`, `mx-auto`) to prevent excessive stretching.

### S1. Landing Page (Public)
*   **Hero:** Animated deep-space canvas (or serene sky for light mode) with subtle particle effects representing air-mass currents.
*   **Headline:** "Navigating a destiny through the air mass."
*   **CTA:** High-contrast Starlight Gold button: "Begin Journey / ගමන ආරම්භ කරන්න".
*   **Trust Banner:** Short disclaimer: "Astrology guidance for cultural, spiritual, and entertainment purposes..."

### S2. Auth Flows (Register / Login)
*   **Fields Mapping (Register):** `email`, `password` (min 8), `fullName`, `mobileNumber` (optional), `preferredLanguage`.
*   **UX:** Instant inline validation. 409 error shows "Account exists — log in instead".

### S3. Dashboard (Logged In)
*   **Layout:** 3-column grid for desktop, vertical stack for mobile.
*   **Focus:** Core pillars: Celestial Mapping, Air Mass Guidance, Destiny Insights.
*   **Next Action:** Prominent "Add Birth Profile" button.

### S4. Birth Profile Form (POST/PATCH `/birth-profiles`)
*   **Fields Visible by Default:** `fullName`, `birthDate`, `birthTime`, `unknownBirthTime` (checkbox), `birthPlaceName`.
*   **Hidden behind "More Settings":** `latitude`, `longitude`, `notes`.
*   **Crucial UX Rule:** If `unknownBirthTime` is checked, disable `birthTime` and reveal an inline Starlight Gold/Warning alert: *"Birth time is approximate or unknown; report accuracy may be reduced."*

### S5. Profile Settings (PATCH `/users/me/profile`)
*   **Fields:** `fullName`, `mobileNumber`, `whatsappNumber`, `preferredLanguage`, `emailMarketingConsent`, `whatsappMarketingConsent`.

## 6. Interactions & Accessibility
*   **Micro-interactions:** Buttons shift to a brighter hue on hover. Content sections use staggered fade-ins on scroll (mimicking drifting through the night sky).
*   **Accessibility:** Tap targets minimum 44x44px. All text must pass WCAG AA contrast ratio against both Deep Space Black and Morning Sky backgrounds.
*   **Motion:** Keep it subtle. Max 2-3 intentional motions per screen (e.g., the celestial compass reacting to cursor, gentle pulse on primary buttons).

## 7. Future Proofing (Phase 2)
Leave visual space/wireframe placeholders for:
*   Product catalogues and pricing cards.
*   Order status stepper (`DRAFT` → `PAID` → `GENERATING` → `COMPLETED`).
*   PDF download interface.

## 8. Brand Assets

- `apps/web/public/brand/taraka-mark.png` — circular icon
- `apps/web/public/brand/taraka-lockup.png` — icon + Tharaka - තාරකා + slogans
- `apps/web/public/brand/taraka-wordmark.png` — icon + Tharaka - තාරකා

## 9. Implementation Status

- Phase 1 customer web scaffolded in `apps/web` (Next.js + Tailwind)
- Connected to API base `NEXT_PUBLIC_API_URL` (default `http://localhost:3000/api/v1`)
