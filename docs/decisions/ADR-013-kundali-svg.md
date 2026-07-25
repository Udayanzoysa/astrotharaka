# ADR-013: South-Indian Rasi Kundali SVG + PDF Embed

## Status

Accepted — 2026-07-22

## Context

SRS requires Kundali/chart visuals with reports. PDFKit does not render SVG natively; Chromium PDF is deferred.

## Decision

1. Generate a **South-Indian rasi grid** SVG from chart JSON in the worker (`apps/worker/src/kundali`).
2. Persist SVG beside the PDF: `{orderNumber}-v{n}-kundali.svg`.
3. Draw the same grid with PDFKit vector primitives inside the PDF report.
4. Expose `GET /api/v1/orders/:id/report/chart.svg` for authenticated preview.
5. North-Indian diamond style deferred; Chromium HTML PDF handled in ADR-014.

## Consequences

- No new native/Chromium dependencies.
- Preview requires JWT (blob fetch in Taraka UI).
- Chart style is South-Indian grid; can add NI later as a second renderer.
- PDFKit still embeds kundali for the fallback engine; Chromium embeds the SVG (ADR-014).
