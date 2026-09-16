import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    authInterrupts: true,
  },
  // allowedDevOrigins: ["192.168.0.123"],
};

export default nextConfig;
