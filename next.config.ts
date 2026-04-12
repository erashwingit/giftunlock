import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable the X-Powered-By header to prevent framework fingerprinting
  poweredByHeader: false,

  turbopack: {
    root: __dirname,
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "xoifkwplilapwllzyazl.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },

  experimental: {
    serverActions: {
      bodySizeLimit: "55mb",
    },
  },

  /**
   * Security headers applied to every response.
   * References: OWASP Secure Headers Project, NIST SP 800-53 SI-10.
   */
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Prevent clickjacking / iframe embedding
          { key: "X-Frame-Options", value: "DENY" },

          // Stop browsers from MIME-sniffing the content type
          { key: "X-Content-Type-Options", value: "nosniff" },

          // Limit referrer information sent to external origins
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },

          // Restrict access to sensitive browser APIs
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },

          // Force HTTPS for 2 years (preload-eligible)
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },

          /**
           * Content Security Policy.
           * - 'unsafe-inline' on script-src is required by Tailwind v4 and
           *   Framer Motion; tighten to a nonce-based policy when feasible.
           * - connect-src allows Supabase, Razorpay, and Resend endpoints.
           */
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https:",
              "media-src 'self' blob: https:",
              "font-src 'self' data:",
              "connect-src 'self' https://*.supabase.co https://api.resend.com https://api.razorpay.com https://lumberjack.razorpay.com",
              "frame-src https://api.razorpay.com",
              "frame-ancestors 'none'",
              "form-action 'self'",
              "base-uri 'self'",
              "upgrade-insecure-requests",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
