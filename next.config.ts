import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* SwachhAI needs request-time rendering (reports/dashboard/map), so the
     experimental cacheComponents model is intentionally off. */
  // Hide the Next.js dev-tools indicator (circular "N" badge, bottom-left).
  devIndicators: false,
  async headers() {
    // Baseline hardening: no MIME sniffing, no clickjacking, minimal
    // referrer + feature surface (camera/mic/geo unused by this app).
    const security = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=(), payment=()",
      },
    ];
    return [{ source: "/:path*", headers: security }];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
