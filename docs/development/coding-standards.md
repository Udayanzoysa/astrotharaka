# Coding Standards

These standards apply as soon as application code is introduced.

## Language and Types

- Use **TypeScript strict mode**
- Avoid `any`; prefer precise types and discriminated unions
- Prefer explicit return types on public service methods when it aids clarity

## Architecture Boundaries

- Keep **controllers / route handlers thin**
- Place business logic in **services or domain layers**
- Maintain clear module boundaries (auth, orders, payments, reports, etc.)
- Do not bypass architecture without an ADR

## API and Validation

- Validate **all** API input at the boundary
- Use **structured error codes** (document in `docs/api/error-codes.md` when APIs exist)
- Keep HTTP responses consistent

## Data and Consistency

- Use **database transactions** for critical operations (orders, payments, report ownership)
- Use **idempotency** for payments and report generation
- Prefer explicit state machines for order/payment/report lifecycle

## Asynchronous Work

- Use **queues** for slow operations
- **Do not** call AI providers inside normal request-response handlers
- **Do not** render PDFs inside API request handlers
- Workers must be retry-safe and ideally idempotent

## Security and Privacy

- Never expose secrets to frontend applications
- Never commit `.env` files with real credentials
- Do not store sensitive information in logs
- Minimize retention and exposure of birth profile and payment data

## Reuse and Quality

- Reuse existing components and utilities when suitable
- Add or update tests for business-critical behaviour
- Prefer small, reviewable changes with matching wiki updates

## Documentation Coupling

A change is incomplete until relevant docs are updated:

- Module docs under `docs/modules/`
- API docs under `docs/api/`
- Schema/migrations under `docs/database/`
- ADRs under `docs/decisions/` when architectural
- `docs/changelog/current-status.md` and `session-log.md`
- `docs/handover/ai-context.md` when status/stack/paths change
