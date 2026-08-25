export interface VerticalBar {
  label: string;
  value: number;
  color: string;
}

interface VerticalBarChartProps {
  bars: VerticalBar[];
  height?: number;
}

const MIN_VISIBLE_PERCENT = 6;

// Plain flexbox, no charting library — bars sized by percent-of-max height,
// with a floor so a real but small count never reads as "basically zero".
export function VerticalBarChart({ bars, height = 140 }: VerticalBarChartProps) {
  const max = Math.max(...bars.map((bar) => bar.value), 1);

  return (
    <div className="flex items-end gap-3" style={{ height }}>
      {bars.map((bar, index) => {
        const rawPct = (bar.value / max) * 100;
        const pct = Math.max(rawPct, MIN_VISIBLE_PERCENT);
        return (
          <div key={`${bar.label}-${index}`} className="flex h-full flex-1 min-w-0 flex-col items-center justify-end gap-1.5">
            <span className="text-sm font-semibold tabular-nums">{bar.value}</span>
            <div className="w-full rounded-t-md" style={{ height: `${pct}%`, background: bar.color }} />
            <span className="text-sm tabular-nums whitespace-nowrap" style={{ color: "var(--text)" }}>
              {bar.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
