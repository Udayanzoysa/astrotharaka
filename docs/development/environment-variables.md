# Environment Variables

Source template: [`.env.example`](../../.env.example)

| Variable | Required | Description |
|----------|----------|-------------|
| `NODE_ENV` | No | `development` / `production` |
| `API_PORT` | No | API port (default `3000`) |
| `API_PREFIX` | No | Global prefix (default `api/v1`) |
| `CORS_ORIGIN` | No | Allowed origin |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `REDIS_HOST` | Yes | Redis host |
| `REDIS_PORT` | Yes | Redis port |
| `REDIS_PASSWORD` | No | Redis password |
| `JWT_ACCESS_SECRET` | Yes | JWT signing secret (min 32 chars recommended) |
| `JWT_ACCESS_EXPIRES_IN` | No | e.g. `1d` |
| `BCRYPT_SALT_ROUNDS` | No | Default `10` |
| `ASTROLOGY_ENGINE_URL` | Yes | e.g. `http://localhost:8001` |
| `S3_ENDPOINT` | Phase 2 | MinIO/S3 endpoint |
| `S3_ACCESS_KEY_ID` | Phase 2 | Access key |
| `S3_SECRET_ACCESS_KEY` | Phase 2 | Secret |
| `S3_BUCKET_REPORTS` | Phase 2 | Reports bucket |
| `PAYHERE_MERCHANT_ID` / `PAYHERE_MERCHANT_SECRET` | Yes (sandbox) | PayHere merchant credentials |
| `PAYHERE_MODE` | No | `sandbox` (default) or `live` |
| `PAYHERE_NOTIFY_URL` | Yes | Public notify URL (use ngrok locally for real notify) |
| `PAYHERE_RETURN_URL` / `PAYHERE_CANCEL_URL` | Yes | Base URLs under Taraka `/orders` |
| `REPORTS_DIR` | No | PDF output directory |
| `NOTIFICATIONS_DIR` | No | File-transport notifications root |
| `WEB_APP_URL` | No | Customer web base URL for notify links |
| `SMTP_*` | No | SMTP email (else file transport) |
| `WHATSAPP_TOKEN` / `WHATSAPP_PHONE_NUMBER_ID` | No | Meta WhatsApp Cloud API |
| `OPENAI_API_KEY` / `OPENAI_MODEL` | No | OpenAI narrative (worker) |
| `GEMINI_API_KEY` / `GEMINI_MODEL` | No | Gemini narrative (worker; default model `gemini-2.0-flash`) |
| `NARRATIVE_PROVIDER` | No | `auto` \| `gemini` \| `openai` \| `local` |
| `PDF_ENGINE` | No | `auto` \| `chromium` \| `pdfkit` |

Never commit real secrets. Frontend must not receive server secrets.
