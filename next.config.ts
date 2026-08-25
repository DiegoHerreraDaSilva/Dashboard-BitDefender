import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone build: copies only what's needed to run into .next/standalone,
  // for a simple copy-and-run deploy onto the internal Windows server.
  // Vercel does its own build output tracing/packaging and this conflicts
  // with it (breaks with an ENOENT on next-server.js.nft.json) — Vercel sets
  // the VERCEL env var during its build, so skip standalone there.
  output: process.env.VERCEL ? undefined : "standalone",
};

export default nextConfig;
