interface GaugeChartProps {
  value: number; // 0-100
  color: string;
  label: string;
  size?: number;
}

const MAJOR_VALUES = [0, 25, 50, 75, 100];
const MINOR_STEP = 4;

function pointAt(cx: number, cy: number, radius: number, value: number) {
  const angleDeg = 180 - value * 1.8;
  const angleRad = (angleDeg * Math.PI) / 180;
  return { x: cx + radius * Math.cos(angleRad), y: cy - radius * Math.sin(angleRad) };
}

// Speedometer-style gauge, plain SVG: tick marks + scale labels around the
// rim, a thin value arc, and the number/qualitative label centered inside —
// no charting library, same approach as DonutChart.
export function GaugeChart({ value, color, label, size = 220 }: GaugeChartProps) {
  const clamped = Math.min(100, Math.max(0, value));
  const cx = size / 2;
  const cy = size * 0.56;
  const tickOuter = size * 0.46;
  const tickInner = size * 0.4;
  const majorTickInner = size * 0.35;
  const arcRadius = size * 0.29;
  const arcWidth = size * 0.045;
  // The "50" tick label sits almost exactly at the SVG's own top edge (its
  // point is only ~size*0.075 below y=0) — without headroom its glyph gets
  // clipped by the SVG's default overflow:hidden. topPadding pushes the
  // whole drawing down so the label has room to breathe above it.
  const topPadding = size * 0.1;
  const height = cy + size * 0.2 + topPadding;
  // Same problem on the sides: the "0"/"100" label anchor points sit at
  // radius size*0.535 from center — past the SVG's own left/right edge
  // (cx ± size/2) even before accounting for the glyph's own width, so
  // those two labels were clipped clean off. sidePadding widens the canvas
  // (mirroring topPadding) instead of shrinking the label radius, so the
  // rim/ticks/arc geometry itself doesn't change size.
  const sidePadding = size * 0.11;
  const width = size + sidePadding * 2;

  const minorTicks = Array.from({ length: Math.floor(100 / MINOR_STEP) + 1 }, (_, i) => i * MINOR_STEP).filter(
    (v) => v <= 100 && !MAJOR_VALUES.includes(v)
  );

  const arcPath = `M ${cx - arcRadius} ${cy} A ${arcRadius} ${arcRadius} 0 0 1 ${cx + arcRadius} ${cy}`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <g transform={`translate(${sidePadding}, ${topPadding})`}>
      <g stroke="rgba(255,255,255,0.28)" strokeWidth={1.5}>
        {minorTicks.map((v) => {
          const inner = pointAt(cx, cy, tickInner, v);
          const outer = pointAt(cx, cy, tickOuter, v);
          return <line key={v} x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} />;
        })}
      </g>
      {MAJOR_VALUES.map((v) => {
        const inner = pointAt(cx, cy, majorTickInner, v);
        const outer = pointAt(cx, cy, tickOuter, v);
        const labelPoint = pointAt(cx, cy, tickOuter + size * 0.075, v);
        return (
          <g key={v}>
            <line x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} stroke="rgba(255,255,255,0.5)" strokeWidth={2} />
            <text
              x={labelPoint.x}
              y={labelPoint.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={size * 0.08}
              fill="var(--text-muted)"
            >
              {v}
            </text>
          </g>
        );
      })}
      <path d={arcPath} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={arcWidth} strokeLinecap="butt" pathLength={100} />
      <path
        d={arcPath}
        fill="none"
        stroke={color}
        strokeWidth={arcWidth}
        strokeLinecap="butt"
        pathLength={100}
        strokeDasharray={`${clamped} ${100 - clamped}`}
      />
      <text x={cx} y={cy - size * 0.02} textAnchor="middle" fontSize={size * 0.22} fontWeight={600} fill="var(--text)">
        {Math.round(clamped)}
      </text>
      <text x={cx} y={cy + size * 0.15} textAnchor="middle" fontSize={size * 0.1} fill="var(--text-muted)">
        {label}
      </text>
      </g>
    </svg>
  );
}
