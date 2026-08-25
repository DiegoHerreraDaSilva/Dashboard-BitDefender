import type { ReactNode } from "react";
import { Card, type CardTone } from "./Card";
import { ProgressBar } from "./ProgressBar";

interface StatTileProps {
  label: string;
  value: ReactNode;
  tone?: CardTone;
  icon?: ReactNode;
  hint?: string;
  progress?: { value: number; max: number };
}

export function StatTile({ label, value, tone = "brand", icon, hint, progress }: StatTileProps) {
  return (
    <Card tone={tone} className="p-5 flex flex-col gap-2">
      <div className="flex items-center gap-2 text-sm font-medium muted">
        {icon}
        <span>{label}</span>
      </div>
      <div className="num-hero text-[48px] leading-none font-semibold tabular-nums">{value}</div>
      {hint ? <div className="text-xs muted">{hint}</div> : null}
      {progress ? <ProgressBar value={progress.value} max={progress.max} tone={tone} /> : null}
    </Card>
  );
}
