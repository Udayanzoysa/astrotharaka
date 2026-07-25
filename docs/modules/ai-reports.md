# AI Reports / PDF

**Status:** Phase 11 — Chromium HTML PDF (auto) + PDFKit fallback + Kundali SVG

## Worker pipeline (`report.generate`)

1. **CALCULATING** — astrology engine or worker local chart
2. **GENERATING_CONTENT** — narrative adapter (Gemini / OpenAI / local)
3. **RENDERING_PDF** — HTML/Chromium or PDFKit → `{order}-v{n}.pdf` + `{order}-v{n}-kundali.svg`
4. **READY** + order **COMPLETED**
5. Enqueue notify jobs

## Narrative providers

| `NARRATIVE_PROVIDER` | Behavior |
|----------------------|----------|
| `auto` (default) | `GEMINI_API_KEY` → `OPENAI_API_KEY` → local templates |
| `gemini` | Gemini only (`GEMINI_MODEL`, default `gemini-2.0-flash`) |
| `openai` | OpenAI only |
| `local` | Template text only |

LLM failures soft-fall back to local. Worker startup log shows `narrative=gemini:…` / `openai:…` / `local-narrative-0.4`.

## Report content outline (Gemini / OpenAI / local)

1. Yoga placements & results  
2. Wealth / property / land / house-building auspicious periods  
3. Education, mind & intellect  
4. Suitable careers; job & promotion timing  
5. Progress businesses & progress windows  
6. Income, expenses & losses  
7. Short-term gochara (Sun, Jupiter, Saturn)  
8. Full 25-year predictive Dasa timeline  
9. Disclaimer  

Prompts require a friendly Sri Lankan astrologer voice (natural conversational Sinhala when `si`) plus deep personalised chart analysis (`apps/worker/src/ai/prompt.ts`).
Gemini/OpenAI target ~2,800–3,600 words (~2 extra A4 pages) with `maxOutputTokens` raised for long PDFs.

## PDF engines

| `PDF_ENGINE` | Behavior |
|--------------|----------|
| `auto` (default) | Chromium first; PDFKit on failure |
| `chromium` | Chromium only |
| `pdfkit` | PDFKit only |

Install browsers once: `pnpm --filter @astro/worker exec playwright install chromium`

## Downloads

| Asset | Path |
|-------|------|
| PDF | `GET /api/v1/orders/:id/report/file` |
| Kundali SVG | `GET /api/v1/orders/:id/report/chart.svg` |

Keep `REPORTS_DIR` identical for API and worker so SVG resolution works.

## Files

- `apps/worker/src/pdf/**` — HTML template + Chromium renderer
- `apps/worker/src/pdf-report.ts` — PDFKit fallback
- `apps/worker/src/kundali/**`
- ADR-009, ADR-013, ADR-014
