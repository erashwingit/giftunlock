import type { NextConfig } from "next";

const securityHeaders = [
  // Prevent clickjacking
  { key: "X-Frame-Options", value: "DENY" },
  // Prevent MIME-type sniffing
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Referrer policy — don't leak full URL to third parties
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Disable browser features not needed
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  // Enforce HTTPS for 1 year (includeSubDomains)
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  // Content Security Policy
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Next.js inline scripts + Vercel Analytics
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com",
      // Supabase storage images + self
      "img-src 'self' data: blob: https://xoifkwplilapwllzyazl.supabase.co",
      // Supabase API calls
      "connect-src 'self' https://xoifkwplilapwllzyazl.supabase.co https://va.vercel-scripts.com",
      // Fonts from self only
      "font-src 'self'",
      // Styles: self + inline (Next.js CSS-in-JS)
      "style-src 'self' 'unsafe-inline'",
      // No iframes
      "frame-ancestors 'none'",
      // Only HTTPS form submissions
      "form-action 'self'",
      // Upgrade HTTP requests to HTTPS
      "upgrade-insecure-requests",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
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
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
