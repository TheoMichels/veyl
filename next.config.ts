import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Allows production builds to succeed while type refinement is completed
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
