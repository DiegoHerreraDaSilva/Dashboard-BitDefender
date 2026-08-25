import { Gauge } from "lucide-react";
import { Card, toneColor, type CardTone } from "@/components/ui/Card";
import { GaugeChart } from "@/components/ui/GaugeChart";
import type { SnapshotState } from "@/lib/cache";
import type { FleetSummary } from "@/lib/gravityzone/classify";

interface RiskGaugeCardProps {
  state: SnapshotState<FleetSummary>;
  className?: string;
}

function riskTone(score: number | null): CardTone {
  if (score === null) return "neutral";
  if (score >= 60) return "bad";
  if (score >= 30) return "warn";
  return "ok";
}

// Matches GravityZone's own PHASR "impact" wording (seen on a live tenant:
// impact: "Média" for a 40% score), so the label reads the same as the
// Control Center itself, not a term we invented.
function riskLabel(tone: CardTone): string {
  if (tone === "bad") return "Alta";
  if (tone === "warn") return "Média";
  if (tone === "ok") return "Baixa";
  return "—";
}

export function RiskGaugeCard({ state, className }: RiskGaugeCardProps) {
  const summary = state.status === "error" ? null : state.data;
  const score = summary?.averageRiskScore ?? null;
  const tone = riskTone(score);

  return (
    <Card tone={tone} className={`p-6 flex flex-col items-center gap-1 ${className ?? ""}`}>
      <h2 className="flex items-center gap-2 self-start text-lg font-semibold tracking-tight">
        <Gauge className="size-5" style={{ color: toneColor(tone) }} aria-hidden />
        Risco médio (PHASR)
      </h2>
      {score === null ? (
        <p className="text-sm muted">Conectando à GravityZone...</p>
      ) : (
        <GaugeChart value={score} color={toneColor(tone)} label={riskLabel(tone)} size={300} />
      )}
    </Card>
  );
}
