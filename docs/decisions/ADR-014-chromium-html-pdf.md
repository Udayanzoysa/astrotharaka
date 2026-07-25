# ADR-014: Chromium HTML → PDF with PDFKit Fallback

## Status

Accepted — 2026-07-22

## Context

PDFKit reports are functional but limited for rich HTML layout (typography, SVG kundali fidelity). Phase 10 embeds kundali via PDFKit primitives; SRS and design prefer print-quality HTML composition.

## Decision

1. Prefer **Playwright Chromium** `page.pdf()` from an in-worker HTML template (`apps/worker/src/pdf`).
2. Embed the same South-Indian kundali SVG inline in the HTML.
3. Env `PDF_ENGINE`:
   - `auto` (default) — try Chromium, fall back to PDFKit on failure
   - `chromium` — Chromium only (fail hard)
   - `pdfkit` — force PDFKit
4. Keep PDFKit path as the durable fallback (no browser binary required).
5. Reuse a shared Chromium browser process for the worker lifetime; close on shutdown.

## Consequences

- Worker depends on Playwright + installed Chromium (`pnpm exec playwright install chromium`).
- Docker/CI images need browser deps or must set `PDF_ENGINE=pdfkit`.
- Output path and report pipeline status unchanged.
