import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensure Archify compiler assets are included in Vercel Serverless Function bundle
  outputFileTracingIncludes: {
    "/api/**/*": ["./src/lib/archify/**/*"],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
