import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: false,
  async headers() {
    const supabaseOrigin = process.env.SUPABASE_URL ?? "https://*.supabase.co";
    const developmentScriptPolicy = process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : "";
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              `connect-src 'self' ${supabaseOrigin} https://challenges.cloudflare.com`,
              "frame-src https://challenges.cloudflare.com",
              "img-src 'self' data: blob:",
              "media-src 'self'",
              "object-src 'none'",
              `script-src 'self' 'unsafe-inline'${developmentScriptPolicy} https://challenges.cloudflare.com`,
              "style-src 'self' 'unsafe-inline'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
