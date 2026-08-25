import type { ReactNode } from "react";

export interface DonutSegment {
  value: number;
  color: string;
}

interface DonutChartProps {
  segments: DonutSegment[];
  size?: number;
  strokeWidth?: number;
  centerLabel?: ReactNode;
}

// Plain SVG, no charting library — a handful of stroke-dasharray circles is
// enough for a 2-3 segment donut, consistent with the rest of the dashboard's
// "no dependency justifies itself here" approach.
export function DonutChart({ segments, size = 120, strokeWidth = 16, centerLabel }: DonutChartProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);

  const arcs = segments.map((segment, index) => {
    const priorValue = segments.slice(0, index).reduce((sum, prior) => sum + prior.value, 0);
    const fraction = total > 0 ? segment.value / total : 0;
    const dash = fraction * circumference;
    const rotation = total > 0 ? (priorValue / total) * 360 - 90 : -90;
    return { ...segment, dash, rotation };
  });

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth={strokeWidth}
        />
        {arcs
          .filter((arc) => arc.dash > 0)
          .map((arc, index) => (
            <circle
              key={index}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={arc.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${arc.dash} ${circumference - arc.dash}`}
              strokeLinecap="butt"
              transform={`rotate(${arc.rotation} ${size / 2} ${size / 2})`}
            />
          ))}
      </svg>
      {centerLabel ? (
        <div className="absolute top-0 right-0 bottom-0 left-0 flex items-center justify-center">{centerLabel}</div>
      ) : null}
    </div>
  );
}
