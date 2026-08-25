import { Building2 } from "lucide-react";
import { Card, toneColor, type CardTone } from "@/components/ui/Card";
import { GaugeChart } from "@/components/ui/GaugeChart";
import { ProgressBar } from "@/components/ui/ProgressBar";
import type { SnapshotState } from "@/lib/cache";
import type { CompanyRiskSummary } from "@/lib/gravityzone/classify";

interface CompanyRiskCardProps {
  state: SnapshotState<CompanyRiskSummary>;
  className?: string;
}

function toneForImpact(impact: CompanyRiskSummary["impact"]): CardTone {
  if (impact === "Alta") return "bad";
  if (impact === "Média") return "warn";
  if (impact === "Baixa") return "ok";
  return "neutral";
}

const BREAKDOWN_ROWS: Array<{ key: keyof CompanyRiskSummary; label: string }> = [
  { key: "findings", label: "Resultados" },
  { key: "vulnerabilities", label: "Vulnerabilidades" },
  { key: "accountRisks", label: "Riscos da conta" },
];

// "Estado da empresa" from Control Center's Risk Management widget — a
// company-wide composite score, distinct from the per-endpoint PHASR average
// shown elsewhere on this dashboard.
export function CompanyRiskCard({ state, className }: CompanyRiskCardProps) {
  const summary = state.status === "error" ? null : state.data;
  const tone = summary ? toneForImpact(summary.impact) : "neutral";

  return (
    <Card tone={tone} className={`p-6 flex flex-col gap-3 ${className ?? ""}`}>
      <h2 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
        <Building2 className="size-5" style={{ color: toneColor(tone) }} aria-hidden />
        Estado da empresa
      </h2>
      {!summary || summary.score === null ? (
        <p className="text-lg muted">Conectando à GravityZone...</p>
      ) : (
        <div className="flex flex-1 items-center gap-4 min-h-0">
          <div className="shrink-0">
            <GaugeChart value={summary.score} color={toneColor(tone)} label={summary.impact} size={190} />
          </div>
          <ul className="flex flex-1 flex-col gap-2 min-w-0">
            {BREAKDOWN_ROWS.map((row) => {
              const value = summary[row.key];
              const pct = typeof value === "number" ? value : 0;
              return (
                <li key={row.key} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-lg">
                    <span className="font-medium">{row.label}</span>
                    <span className="tabular-nums muted">{typeof value === "number" ? `${Math.round(value)}%` : "—"}</span>
                  </div>
                  <ProgressBar value={pct} max={100} tone={tone} />
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </Card>
  );
}
