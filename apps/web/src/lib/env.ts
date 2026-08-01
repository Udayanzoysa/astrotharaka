/**
 * Public API base URL for browser requests.
 * Must be set at build time for production (NEXT_PUBLIC_API_URL).
 */
export function getApiUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (url) return url.replace(/\/$/, '');
  return 'http://localhost:3000/api/v1';
}

/** True when local PayHere sandbox-complete may be called after return. */
export function allowDevPayments(): boolean {
  return (
    process.env.NODE_ENV !== 'production' &&
    process.env.NEXT_PUBLIC_ALLOW_DEV_PAYMENTS === 'true'
  );
}
