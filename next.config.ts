import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensure Archify compiler assets are included in Vercel Serverless Function bundle
  outputFileTracingIncludes: {
    "/api/**/*": ["./src/lib/archify/**/*"],
  },
};

export default nextConfig;
