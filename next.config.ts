import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["10.0.0.34", "127.0.0.1"],
  experimental: {
    // Player and captain bottom navigation opts into full route prefetching.
    // Keep its signed-in browser cache brief so owner changes are picked up
    // quickly, while the owner and platform routes remain live by default.
    staleTimes: {
      static: 60,
    },
    serverActions: {
      bodySizeLimit: "20mb",
    },
  },
};

export default nextConfig;
