import { NextResponse, type NextRequest } from "next/server";

/**
 * Per-request CSP with nonces + strict-dynamic (Next.js recommended).
 * Production script-src has no 'unsafe-inline' / host allowlist bypass surface.
 *
 * Trusted Types (`require-trusted-types-for`) is Report-Only: full enforcement
 * still breaks Next.js hydration without a complete TT policy set.
 */
export function middleware(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const isDev = process.env.NODE_ENV === "development";

  const cspHeader = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "connect-src 'self' https: http: ws: wss:",
    "media-src 'self' blob:",
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
    "trusted-types default nextjs nextjs#bundler nextjs#static-generation nextjs#hydration goog#html 'allow-duplicates'",
    ...(isDev ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");

  const trustedTypesReportOnly = [
    "require-trusted-types-for 'script'",
    "trusted-types default nextjs nextjs#bundler nextjs#static-generation nextjs#hydration goog#html 'allow-duplicates'",
  ].join("; ");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  // Next.js reads CSP from the *request* to stamp nonces onto framework scripts.
  requestHeaders.set("Content-Security-Policy", cspHeader);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  response.headers.set("Content-Security-Policy", cspHeader);
  response.headers.set("Content-Security-Policy-Report-Only", trustedTypesReportOnly);
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  response.headers.set("Cross-Origin-Resource-Policy", "same-site");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()",
  );

  return response;
}

export const config = {
  matcher: [
    {
      source:
        "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
