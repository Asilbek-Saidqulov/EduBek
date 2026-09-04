import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // Standalone output causes Vercel builds to fail with:
  // ENOENT: no such file or directory, open '/vercel/path0/.next/next-server.js.nft.json'
  // Only enable standalone for self-hosted container builds when explicitly requested.
  ...(process.env.BUILD_STANDALONE === "true" && !process.env.VERCEL
    ? { output: "standalone" as const }
    : {}),  
  async rewrites() {
    const realtime = process.env.REALTIME_URL || "http://127.0.0.1:3001";
    return [{ source: "/api/socket/io", destination: `${realtime}/api/socket/io` },
            { source: "/api/socket/io/:path*", destination: `${realtime}/api/socket/io/:path*` }];
  },
  // TypeScript errors are verified separately via `npx tsc --noEmit`.
  // The Next.js-internal TS checker OOM-kills on this project's many files.
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // ---------------------------------------------------------------------------
  // Security headers — applied to every route. Minimum baseline for a
  // production web app handling authenticated traffic and PII.
  // ---------------------------------------------------------------------------
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // CSP headers adjusted for preview environment
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https: blob:",
              "font-src 'self' data:",
              "connect-src 'self' wss: ws: https:",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          { key: "X-DNS-Prefetch-Control", value: "off" },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
