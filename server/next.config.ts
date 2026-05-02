import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // The shared workspace package ships .ts directly (no build step).
  // Tell Next to run it through SWC so it can be imported from app code.
  transpilePackages: ["@wedding-hall/shared"],
};

export default nextConfig;
