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
const VALUE_GAP_PX = 6;

// Plain CSS grid, no charting library — the label row is `auto` and the
// track row is `minmax(0, 1fr)`, so the grid algorithm hands the track a
// real, definite pixel height (total minus whatever the label actually
// needs) *before* the bar's percent-height is resolved against it. A
// flexbox column with `justify-end` looks equivalent but isn't: text and
// bar there compete as siblings under default flex-shrink, so once a bar's
// percent-height demands more room than is left after the text, it silently
// clamps to "whatever's left" — which is the same amount for every bar past
// that threshold. That flattened e.g. a 70%-of-max and a 100%-of-max bar to
// the exact same rendered height (confirmed live: both landed at 78px).
//
// The value number is positioned with `bottom: calc(pct% + gap)`, not
// stacked above the track as its own row — a fixed row would put every
// bar's number on the same horizontal line regardless of how tall that
// bar actually is, so a short bar reads as disconnected from its own
// number. Anchoring by the same percentage the bar itself uses keeps the
// number glued just above wherever that bar's top edge lands.
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
            style={{ gridTemplateRows: "minmax(0, 1fr) auto" }}
          >
            <div className="relative w-full min-h-0">
              <span
                className="absolute inset-x-0 text-center text-lg font-semibold tabular-nums whitespace-nowrap"
                style={{ bottom: `calc(${pct}% + ${VALUE_GAP_PX}px)` }}
              >
                {bar.value}
              </span>
              <div
                className="absolute inset-x-0 bottom-0 rounded-t-md"
                style={{ height: `${pct}%`, background: bar.color }}
              />
            </div>
            <span className="text-lg tabular-nums whitespace-nowrap" style={{ color: "var(--text)" }}>
              {bar.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
