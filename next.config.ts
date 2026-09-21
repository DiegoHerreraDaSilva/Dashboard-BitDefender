import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone build: copies only what's needed to run into .next/standalone,
  // for a simple copy-and-run deploy onto the internal Windows server.
  output: "standalone",
};

export default nextConfig;
