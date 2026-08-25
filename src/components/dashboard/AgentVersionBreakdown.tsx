import { CheckCircle2, Cpu } from "lucide-react";
import { Card, TEXT_MUTED_COLOR, toneColor } from "@/components/ui/Card";
import { VerticalBarChart } from "@/components/ui/VerticalBarChart";
import type { SnapshotState } from "@/lib/cache";
import { compareVersions, type FleetSummary } from "@/lib/gravityzone/classify";

interface AgentVersionBreakdownProps {
  state: SnapshotState<FleetSummary>;
  className?: string;
}

const MAX_BARS_SHOWN = 6;

function pct(value: number, total: number): number {
  return total > 0 ? Math.round((value / total) * 100) : 0;
}

// Outdated agents are the quiet cause of a "protected" endpoint that really
// isn't. The newest version number actually running somewhere in the fleet
// (a real dot-separated compare, not a popularity vote) is the target —
// highlighted green in the bar chart, everything else neutral. Zero extra
// API calls — agent.productVersion rides along on the same
// getManagedEndpointDetails call already made per endpoint.
export function AgentVersionBreakdown({ state, className }: AgentVersionBreakdownProps) {
  const summary = state.status === "error" ? null : state.data;
  const versions = summary?.agentVersions ?? [];
  const total = versions.reduce((sum, entry) => sum + entry.count, 0);
  const latest = versions.find((entry) => entry.isLatest) ?? null;
  const shown = versions.slice(0, MAX_BARS_SHOWN);
  const hiddenCount = versions.length - shown.length;
  // Selection above stays relevance-ranked (latest + most common others);
  // display order is chronological left-to-right — oldest version on the
  // left, newest on the right — like a version-adoption timeline.
  const displayOrder = [...shown].sort((a, b) => compareVersions(a.version, b.version));

  return (
    <Card className={`p-6 flex flex-col gap-3 overflow-hidden ${className ?? ""}`}>
      <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
        <Cpu className="size-5" aria-hidden />
        Versão do agente
      </h2>
      {!summary ? (
        <p className="text-sm muted">Conectando à GravityZone...</p>
      ) : versions.length === 0 || !latest ? (
        <p className="text-sm muted">Nenhum dado de versão disponível.</p>
      ) : (
        <>
          <p className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="size-4 shrink-0" style={{ color: toneColor("ok") }} aria-hidden />
            <span className="font-medium tabular-nums">{latest.version}</span>
            <span className="muted">
              é a mais recente · <span className="tabular-nums">{pct(latest.count, total)}%</span> da frota
            </span>
          </p>
          <VerticalBarChart
            height={130}
            bars={displayOrder.map((entry) => ({
              label: entry.version,
              value: entry.count,
              color: entry.isLatest ? toneColor("ok") : TEXT_MUTED_COLOR,
            }))}
          />
          {hiddenCount > 0 ? <p className="text-xs muted">+{hiddenCount} outras versões</p> : null}
        </>
      )}
    </Card>
  );
}
