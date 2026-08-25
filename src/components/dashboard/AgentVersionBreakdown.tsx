import { Cpu } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import type { SnapshotState } from "@/lib/cache";
import type { FleetSummary } from "@/lib/gravityzone/classify";

interface AgentVersionBreakdownProps {
  state: SnapshotState<FleetSummary>;
  className?: string;
}

const MAX_VERSIONS_SHOWN = 3;

// Outdated agents are the quiet cause of a "protected" endpoint that really
// isn't. The majority version among managed endpoints is treated as the
// fleet's baseline; anything else is flagged, since the API exposes no
// separate "latest version" reference to compare against. Zero extra API
// calls — agent.productVersion rides along on the same getManagedEndpointDetails
// call already made per endpoint for malware/offline status.
export function AgentVersionBreakdown({ state, className }: AgentVersionBreakdownProps) {
  const summary = state.status === "error" ? null : state.data;
  const versions = summary?.agentVersions ?? [];
  const shown = versions.slice(0, MAX_VERSIONS_SHOWN);
  const hiddenCount = versions.length - shown.length;
  const maxCount = versions[0]?.count ?? 0;

  return (
    <Card className={`p-6 flex flex-col gap-3 overflow-hidden ${className ?? ""}`}>
      <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
        <Cpu className="size-5" aria-hidden />
        Versão do agente
      </h2>
      {!summary ? (
        <p className="text-sm muted">Conectando à GravityZone...</p>
      ) : versions.length === 0 ? (
        <p className="text-sm muted">Nenhum dado de versão disponível.</p>
      ) : (
        <>
          <ul className="flex flex-col gap-3">
            {shown.map((entry) => (
              <li key={entry.version} className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-base">
                  <span className="font-medium tabular-nums">{entry.version}</span>
                  <span className="flex items-center gap-2 tabular-nums">
                    <span className="muted">{entry.count}</span>
                    {!entry.isMajority ? (
                      <span className="text-xs" style={{ color: "var(--accent-hi)" }}>
                        desatualizado
                      </span>
                    ) : null}
                  </span>
                </div>
                <ProgressBar value={entry.count} max={maxCount} tone={entry.isMajority ? "ok" : "brand"} />
              </li>
            ))}
          </ul>
          {hiddenCount > 0 ? <p className="text-xs muted">+{hiddenCount} outras versões</p> : null}
        </>
      )}
    </Card>
  );
}
