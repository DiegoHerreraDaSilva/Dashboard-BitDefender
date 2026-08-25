import type { Config } from "tailwindcss";

// Tailwind v3, not v4: v4's compiled output wraps everything in @layer
// (CSS Cascade Layers, ~2022+ browser support) — the TV's built-in browser
// is old enough to not support @layer at all, so it silently drops every
// Tailwind style. v3's output is plain flat CSS with no cascade-layer
// dependency, so it actually renders there.
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
};

export default config;
