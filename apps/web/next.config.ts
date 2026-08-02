import type { NextConfig } from "next";

/**
 * Static security headers only.
 * CSP is set per-request in `src/middleware.ts` (nonce + strict-dynamic).
 * Do not set Content-Security-Policy here — it would override/conflict with nonces.
 */
const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [],
    formats: ["image/avif", "image/webp"],
  },
  poweredByHeader: false,
  compress: true,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
