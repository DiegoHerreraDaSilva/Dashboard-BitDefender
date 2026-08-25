import { TEXT_COLOR } from "@/components/ui/Card";

export interface VerticalBar {
  label: string;
  value: number;
  color: string;
}

interface VerticalBarChartProps {
  bars: VerticalBar[];
  height?: number;
}

const MIN_VISIBLE_PERCENT = 0.06;
const VALUE_ROW_HEIGHT = 18;
const LABEL_ROW_HEIGHT = 18;
const ROW_GAP = 6;

// Plain flexbox, no charting library — bar heights are computed as real
// pixels in JS, not CSS percentages, and set directly via inline style.
// Confirmed on the TV's browser: a percentage height on an element nested
// inside a flex child with h-full (itself a percentage of a fixed-px
// container) doesn't resolve reliably — bars rendered wildly too tall,
// overflowing the card. Real pixel heights sidestep that entirely.
export function VerticalBarChart({ bars, height = 140 }: VerticalBarChartProps) {
  const max = Math.max(...bars.map((bar) => bar.value), 1);
  const barMaxHeight = Math.max(height - VALUE_ROW_HEIGHT - LABEL_ROW_HEIGHT - ROW_GAP * 2, 10);

  return (
    <div className="flex items-end gap-3" style={{ height }}>
      {bars.map((bar, index) => {
        const rawHeight = (bar.value / max) * barMaxHeight;
        const barHeight = Math.max(rawHeight, barMaxHeight * MIN_VISIBLE_PERCENT);
        return (
          <div
            key={`${bar.label}-${index}`}
            className="flex flex-1 min-w-0 flex-col items-center justify-end gap-1.5"
            style={{ height }}
          >
            <span className="text-xs font-semibold tabular-nums">{bar.value}</span>
            <div className="w-full rounded-t-md" style={{ height: barHeight, background: bar.color }} />
            <span className="text-xs tabular-nums whitespace-nowrap" style={{ color: TEXT_COLOR }}>
              {bar.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
