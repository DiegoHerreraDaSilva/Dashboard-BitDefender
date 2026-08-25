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

// Plain CSS grid, no charting library — the value/label text rows are `auto`
// and the bar-track row is `minmax(0, 1fr)`, so the grid algorithm hands the
// track a real, definite pixel height (total minus whatever the text rows
// actually need) *before* the bar's percent-height is resolved against it.
// A flexbox column with `justify-end` looks equivalent but isn't: text and
// bar there compete as siblings under default flex-shrink, so once a bar's
// percent-height demands more room than is left after the text, it silently
// clamps to "whatever's left" — which is the same amount for every bar past
// that threshold. That flattened e.g. a 70%-of-max and a 100%-of-max bar to
// the exact same rendered height (confirmed live: both landed at 78px).
export function VerticalBarChart({ bars, height = 140 }: VerticalBarChartProps) {
  const max = Math.max(...bars.map((bar) => bar.value), 1);

  return (
    <div className="flex items-end gap-3" style={{ height }}>
      {bars.map((bar, index) => {
        const rawPct = (bar.value / max) * 100;
        const pct = Math.max(rawPct, MIN_VISIBLE_PERCENT);
        return (
          <div
            key={`${bar.label}-${index}`}
            className="grid h-full flex-1 min-w-0 justify-items-center gap-1.5"
            style={{ gridTemplateRows: "auto minmax(0, 1fr) auto" }}
          >
            <span className="text-base font-semibold tabular-nums">{bar.value}</span>
            <div className="flex w-full min-h-0 flex-col justify-end">
              <div className="w-full rounded-t-md" style={{ height: `${pct}%`, background: bar.color }} />
            </div>
            <span className="text-base tabular-nums whitespace-nowrap" style={{ color: "var(--text)" }}>
              {bar.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
