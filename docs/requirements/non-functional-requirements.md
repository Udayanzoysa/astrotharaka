# Non-Functional Requirements (Summary)

**Source:** [`docs/AstroAI_Lanka_SRS.md`](../AstroAI_Lanka_SRS.md) §9  
**Status:** Summary linked to SRS.

## Performance

- Responsive API for interactive flows
- Long-running report work via queues (NFR alignment with engineering rules)
- Scalable object storage for PDFs/static assets

## Availability & Reliability

- Background retries for failed generation/delivery
- Monitoring of queues, payments, AI, and delivery failures

## Security

- HTTPS in transit
- Strong admin authentication
- RBAC
- Secrets never exposed to clients
- No sensitive data in logs
- Input validation on all APIs

## Privacy

- Restrict birth-data access
- Consent recording
- Account deletion support
- Limit data shared with AI providers

## Usability & Localization

- Sinhala, Tamil, English
- Correct rendering of Sinhala/Tamil in UI and PDFs

## Maintainability & Scalability

- Modular architecture
- Configurable integration adapters
- Horizontal scale for workers and static/report storage

## Compatibility

- Modern desktop/mobile browsers; Android/iOS clients (mobile app later)
