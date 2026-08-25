import { Monitor } from "lucide-react";
import { Card, toneColor } from "@/components/ui/Card";
import { DonutChart } from "@/components/ui/DonutChart";
import type { SnapshotState } from "@/lib/cache";
import type { FleetSummary } from "@/lib/gravityzone/classify";

interface TotalEndpointsCardProps {
  state: SnapshotState<FleetSummary>;
  className?: string;
}

function pct(value: number, total: number): number {
  return total > 0 ? Math.round((value / total) * 100) : 0;
}

export function TotalEndpointsCard({ state, className }: TotalEndpointsCardProps) {
  const summary = state.status === "error" ? null : state.data;

  return (
    <Card className={`p-6 flex flex-col gap-4 ${className ?? ""}`}>
      <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
        <Monitor className="size-5" aria-hidden />
        Total de endpoints
      </h2>
      {!summary ? (
        <p className="text-sm muted">Conectando à GravityZone...</p>
      ) : (
        <div className="flex items-center gap-8">
          <DonutChart
            size={160}
            strokeWidth={20}
            segments={[
              { value: summary.managedCount, color: toneColor("ok") },
              { value: summary.unmanagedCount, color: toneColor("warn") },
            ]}
            centerLabel={<span className="text-4xl font-semibold tabular-nums">{summary.total}</span>}
          />
          <div className="flex flex-col gap-3 text-base">
            <div className="flex items-center gap-3">
              <span className="size-3.5 rounded-full shrink-0" style={{ background: toneColor("ok") }} aria-hidden />
              <span className="font-medium">Gerenciados</span>
              <span className="muted tabular-nums">
                {summary.managedCount} ({pct(summary.managedCount, summary.total)}%)
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="size-3.5 rounded-full shrink-0" style={{ background: toneColor("warn") }} aria-hidden />
              <span className="font-medium">Não gerenciados</span>
              <span className="muted tabular-nums">
                {summary.unmanagedCount} ({pct(summary.unmanagedCount, summary.total)}%)
              </span>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
