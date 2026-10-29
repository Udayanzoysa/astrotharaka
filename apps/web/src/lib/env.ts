/**
 * Public API base URL for browser requests.
 * Must be set at build time for production (NEXT_PUBLIC_API_URL).
 */
export function getApiUrl(): string {
  const url = (
    process.env.INTERNAL_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    (process.env.API_PORT ? `http://localhost:${process.env.API_PORT}/api/v1` : '')
  )?.trim();
  if (url) return url.replace(/\/$/, '');
  return 'http://localhost:3005/api/v1';
}

/** True when local PayHere sandbox-complete may be called after return. */
export function allowDevPayments(): boolean {
  return (
    process.env.NODE_ENV !== 'production' &&
    process.env.NEXT_PUBLIC_ALLOW_DEV_PAYMENTS === 'true'
  );
}
