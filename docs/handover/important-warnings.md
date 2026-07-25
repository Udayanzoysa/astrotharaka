# Important Warnings

1. **Do not call AI or render PDFs in API HTTP handlers** — use BullMQ workers.
2. **Astrology calculations must not rely only on generative AI** — use the engine service.
3. **Secrets** stay in env files / secret stores — never in frontend.
4. **BR-001:** Do not release reports before payment confirmation (when payments exist).
5. **Docker required** for local Postgres/Redis/MinIO/engine as configured.
6. **SRS is Draft v1.0** — confirm with stakeholders before major scope changes.
7. Worker astrology jobs currently send a **stub birth payload**; fix before production calculations.
8. Update the wiki after every meaningful change; handover file is the AI continuity source.
