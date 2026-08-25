import { toneClassName, type CardTone } from "./Card";

interface ProgressBarProps {
  value: number;
  max: number;
  tone?: CardTone;
}

const MIN_VISIBLE_PERCENT = 6;

export function ProgressBar({ value, max, tone = "brand" }: ProgressBarProps) {
  const rawPct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  // A real but small count (e.g. 1 infected out of 69) would otherwise render
  // as a near-invisible hairline — the single most urgent fact on the card
  // must never look weaker than "basically zero".
  const pct = rawPct > 0 ? Math.max(rawPct, MIN_VISIBLE_PERCENT) : 0;
  return (
    <div className="bar-track h-3 w-full">
      <div className={`bar-fill h-full ${toneClassName(tone)}`} style={{ width: `${pct}%` }} />
    </div>
  );
}
