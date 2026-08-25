import type { ReactNode } from "react";

export type CardTone = "brand" | "ok" | "warn" | "bad" | "neutral";

// Hardcoded hex, not var(--x) — confirmed live on the TV's browser: it
// doesn't support CSS custom properties at all, so a var() value is invalid
// and the whole declaration (inline style or CSS) gets dropped. These are
// the resolved values of the tokens in globals.css; keep them in sync.
const TONE_HEX: Record<CardTone, string> = {
  brand: "#4fe3dc",
  ok: "#3ddc97",
  warn: "#ffc247",
  bad: "#ff6b6b",
  neutral: "#9aa6b0",
};

export function toneColor(tone: CardTone): string {
  return TONE_HEX[tone];
}

// Same reasoning as TONE_HEX — hardcoded hex for the base text tokens that
// get set inline (color/fill on icons and SVG text), since var() doesn't
// work at all on the TV's browser.
export const TEXT_COLOR = "#eef2f4";
export const TEXT_MUTED_COLOR = "#9aa6b0";
export const BRAND_COLOR = "#3bbdc9";

// For styling that varies per card instance (the accent line/glow, the
// progress-bar fill) a single shared CSS rule can't read a per-instance
// value without custom properties — so instead of setting --card-accent
// inline (which does nothing on this browser), each tone gets its own class
// with hardcoded hex baked into globals.css (.card.tone-bad::after etc.).
export function toneClassName(tone: CardTone): string {
  return tone === "brand" ? "" : `tone-${tone}`;
}

interface CardProps {
  tone?: CardTone;
  className?: string;
  children: ReactNode;
}

export function Card({ tone = "brand", className, children }: CardProps) {
  return <div className={`card ${toneClassName(tone)} ${className ?? ""}`}>{children}</div>;
}
