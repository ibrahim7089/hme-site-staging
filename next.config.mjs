/** @type {import('next').NextConfig} */
const securityHeaders = [
  // Prevent clickjacking — blocks the site from being framed by other domains
  { key: "X-Frame-Options", value: "DENY" },
  // Stop browsers from MIME-sniffing response content types
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Only send origin (no path/query) in Referer header on cross-origin requests
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Force HTTPS for 1 year; Vercel enforces TLS but this tells browsers to remember it
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  // Disable browser features not needed on a marketing site
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  // Content Security Policy
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",  // Next.js requires unsafe-inline for hydration scripts
      "style-src 'self' 'unsafe-inline'",   // Tailwind inline styles require this
      "font-src 'self' data:",
      "img-src 'self' data: blob: https://*.public.blob.vercel-storage.com",
      "connect-src 'self' https://vitals.vercel-insights.com",
      "frame-src https://www.google.com https://maps.google.com",
      "frame-ancestors 'none'",             // belt-and-suspenders alongside X-Frame-Options
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

const nextConfig = {
  reactStrictMode: true,
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [360, 480, 640, 750, 828, 1080, 1200, 1600],
    imageSizes: [32, 48, 64, 96, 128, 256, 384],
    qualities: [70, 75, 82],
    minimumCacheTTL: 2592000,
    remotePatterns: [{ protocol: "https", hostname: "*.public.blob.vercel-storage.com" }],
  },
  async headers() {
    return [
      { source: "/(.*)", headers: securityHeaders },
      {
        // Staging and preview deployments serve the same pages as the live
        // site and robots.txt allows crawling, so without this they compete
        // with hmeremit.com.my in search as duplicate content. The real domain
        // is unaffected.
        source: "/(.*)",
        has: [{ type: "host", value: ".*\\.vercel\\.app" }],
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
};

export default nextConfig;
