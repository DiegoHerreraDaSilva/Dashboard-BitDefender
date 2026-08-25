import type { CSSProperties, ReactNode } from "react";

export type CardTone = "brand" | "ok" | "warn" | "bad" | "neutral";

// Static tone → CSS variable mapping. Deliberately avoids color-mix(), which
// is only supported on newer browser engines — the TV's stock browser age is
// unknown, so tone colors are precomputed plain tokens (see globals.css).
export function toneVars(tone: CardTone = "brand"): CSSProperties {
  if (tone === "brand") return {};
  if (tone === "neutral") {
    return {
      "--card-accent": "var(--text-muted)",
      "--card-accent-hi": "var(--text-muted)",
      "--card-glow": "transparent",
    } as CSSProperties;
  }
  return {
    "--card-accent": `var(--${tone})`,
    "--card-accent-hi": `var(--${tone}-hi)`,
    "--card-glow": `var(--${tone}-glow)`,
  } as CSSProperties;
}

export function toneColor(tone: CardTone): string {
  switch (tone) {
    case "ok":
      return "var(--ok)";
    case "warn":
      return "var(--warn)";
    case "bad":
      return "var(--bad)";
    case "neutral":
      return "var(--text-muted)";
    default:
      return "var(--accent-hi)";
  }
}

interface CardProps {
  tone?: CardTone;
  className?: string;
  children: ReactNode;
}

export function Card({ tone = "brand", className, children }: CardProps) {
  return (
    <div className={`card ${className ?? ""}`} style={toneVars(tone)}>
      {children}
    </div>
  );
}
