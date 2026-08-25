import { ShieldAlert, ShieldCheck, ShieldQuestion, WifiOff } from "lucide-react";
import { Card, toneColor, type CardTone } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import type { SnapshotState } from "@/lib/cache";
import type { FleetSummary } from "@/lib/gravityzone/classify";

interface FleetHealthBlockProps {
  state: SnapshotState<FleetSummary>;
  className?: string;
}

// Protegidos/Em risco/Offline/Sem política over the correct base
// (managedCount, not the whole discovered fleet) — a device with no agent
// has nothing here to report on.
export function FleetHealthBlock({ state, className }: FleetHealthBlockProps) {
  const summary = state.status === "error" ? null : state.data;
  const managedCount = summary?.managedCount ?? 0;

  const rows: Array<{ label: string; value: number; tone: CardTone; Icon: typeof ShieldCheck }> = summary
    ? [
        { label: "Protegidos", value: summary.protectedCount, tone: "ok", Icon: ShieldCheck },
        { label: "Em risco (malware)", value: summary.atRiskCount, tone: "bad", Icon: ShieldAlert },
        { label: "Offline", value: summary.offlineCount, tone: "warn", Icon: WifiOff },
        { label: "Sem política aplicada", value: summary.noPolicyCount, tone: "warn", Icon: ShieldQuestion },
      ]
    : [];

  return (
    <Card className={`p-6 flex flex-col gap-2 ${className ?? ""}`}>
      <h2 className="text-2xl font-semibold tracking-tight">Saúde dos gerenciados</h2>
      {!summary ? (
        <p className="text-lg muted">Conectando à GravityZone...</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {rows.map((row) => {
            const Icon = row.Icon;
            const pct = managedCount > 0 ? Math.round((row.value / managedCount) * 100) : 0;
            return (
              <li key={row.label} className="flex flex-col gap-0.5">
                <div className="flex items-center justify-between text-xl">
                  <span className="flex items-center gap-2 font-medium">
                    <Icon className="size-4 shrink-0" style={{ color: toneColor(row.tone) }} aria-hidden />
                    {row.label}
                  </span>
                  <span className="tabular-nums">
                    <span className="text-2xl font-semibold">{row.value}</span>{" "}
                    <span className="text-lg muted">({pct}%)</span>
                  </span>
                </div>
                <ProgressBar value={row.value} max={managedCount} tone={row.tone} thin />
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
