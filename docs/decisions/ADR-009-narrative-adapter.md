# ADR-009: Pluggable Narrative Adapter for Report Content

## Status

Accepted — 2026-07-22

## Context

Paid orders need customer-facing report text after chart calculation. Live LLM providers may be unavailable in local/dev; Swiss Ephemeris is not integrated yet. SRS still requires queued AI-assisted generation and PDF delivery.

## Decision

1. Define a `NarrativeAdapter` interface in the worker (`apps/worker/src/ai`).
2. Providers (soft-fallback to local on LLM failure):
   - **Gemini** (`GEMINI_API_KEY`, `GEMINI_MODEL`)
   - **OpenAI** (`OPENAI_API_KEY`, `OPENAI_MODEL`)
   - **LocalNarrativeAdapter** (deterministic EN/SI/TA templates)
3. `NARRATIVE_PROVIDER`: `auto` (Gemini → OpenAI → local) | `gemini` | `openai` | `local`.
4. Keep prompts in code for Phase 6; Prompt CMS / DB versioning later.
5. PDF rendering via Chromium/PDFKit (ADR-008, ADR-014).

## Consequences

- Local DEV_CONFIRM / PayHere sandbox always produce readable PDFs without API keys.
- Production enables Gemini or OpenAI via env without worker code changes.
- Chart calculation is independent of narrative provider.
