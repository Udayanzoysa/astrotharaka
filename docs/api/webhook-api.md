# Webhook API

## POST `/webhooks/payhere`

Public PayHere notify endpoint (form-urlencoded).

- Verifies MD5 signature using merchant secret
- On `status_code=2`, marks PayHere payment paid and starts report generation
- Always returns HTTP 200 with `{ status }` for PayHere retries

Configure PayHere merchant **Notify URL** to one of:

- `https://<public-host>/api/v1/webhooks/payhere`
- `https://<public-host>/api/v1/public/payments/payhere/notify`

Localhost notify URLs will not receive PayHere callbacks. Use ngrok, or rely on:

## POST `/public/payments/payhere/sandbox-complete`

JWT-protected local helper (disabled when `PAYHERE_MODE=live`).

Body:

```json
{ "orderId": "<uuid>" }
```

Called automatically by Taraka order page after `?payhere=return`.
