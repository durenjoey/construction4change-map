import type { NextConfig } from "next";

/**
 * Content-Security-Policy.
 *
 * Hard requirement: this app is iframe-embedded into CfC's WordPress site,
 * so we DO NOT set X-Frame-Options: DENY. Instead we scope `frame-ancestors`
 * to CfC's origins, which is the must-have restriction here.
 *
 * The rest is deliberately kept permissive on script/style because Mapbox GL
 * relies on `worker-src blob:`, web-worker `blob:` URLs, and (in some builds)
 * `'unsafe-eval'`. An over-tight CSP is the usual cause of a blank map, so we
 * explicitly allow the Mapbox origins (api.mapbox.com, events.mapbox.com,
 * *.tiles.mapbox.com) and blob/worker sources.
 */
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://api.mapbox.com",
  "worker-src 'self' blob:",
  "child-src 'self' blob:",
  "style-src 'self' 'unsafe-inline' https://api.mapbox.com https://fonts.googleapis.com",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https://fonts.gstatic.com",
  "connect-src 'self' https://api.mapbox.com https://events.mapbox.com https://*.tiles.mapbox.com https://*.mapbox.com",
  "frame-ancestors https://www.constructionforchange.org https://constructionforchange.org",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "geolocation=(), microphone=(), camera=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
