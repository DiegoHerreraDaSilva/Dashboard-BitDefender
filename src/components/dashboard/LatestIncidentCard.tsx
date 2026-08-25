import { AlertTriangle, Info, Repeat2, ShieldAlert, ShieldQuestion } from "lucide-react";
import { Card, toneColor, type CardTone } from "@/components/ui/Card";
import type { SnapshotState } from "@/lib/cache";
import type { IncidentSeverity } from "@/lib/gravityzone/classify";
import type { IncidentsSummary } from "@/lib/gravityzone/incidents";

interface LatestIncidentCardProps {
  state: SnapshotState<IncidentsSummary>;
  className?: string;
}

const SEVERITY_META: Record<IncidentSeverity, { tone: CardTone; Icon: typeof ShieldAlert; label: string }> = {
  critical: { tone: "bad", Icon: ShieldAlert, label: "Crítica" },
  high: { tone: "bad", Icon: ShieldAlert, label: "Alta" },
  medium: { tone: "warn", Icon: AlertTriangle, label: "Média" },
  low: { tone: "brand", Icon: Info, label: "Baixa" },
  unknown: { tone: "neutral", Icon: ShieldQuestion, label: "Desconhecida" },
};

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

const DATE_FORMATTER = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  day: "2-digit",
  month: "2-digit",
});

// Precomputed rgba, not color-mix() or var() — the TV's browser doesn't
// support either, so tinted badge backgrounds use the same hardcoded values
// as the card's own tone glow (see globals.css) instead of a CSS token.
function toneGlow(tone: CardTone): string {
  switch (tone) {
    case "ok":
      return "rgba(61, 220, 151, 0.4)";
    case "warn":
      return "rgba(255, 194, 71, 0.4)";
    case "bad":
      return "rgba(255, 107, 107, 0.4)";
    case "neutral":
      return "transparent";
    default:
      return "rgba(79, 227, 220, 0.35)";
  }
}

// A zoomed-in spotlight on the single most recent incident — the compact
// feed next to it optimizes for scanning many rows, this optimizes for
// answering "what exactly just happened" without abbreviating anything.
export function LatestIncidentCard({ state, className }: LatestIncidentCardProps) {
  const latest = state.status === "error" ? null : state.data.activity[0] ?? null;
  const isRecurring = (latest?.count ?? 0) >= 2;
  const meta = latest ? SEVERITY_META[latest.severity] : null;
  const tone: CardTone = isRecurring ? "bad" : meta?.tone ?? "neutral";
  const Icon = isRecurring ? Repeat2 : meta?.Icon ?? ShieldQuestion;

  return (
    <Card tone={tone} className={`p-6 flex flex-col gap-4 ${className ?? ""}`}>
      <h2 className="text-lg font-semibold tracking-tight">Último incidente</h2>
      {!latest ? (
        <p className="text-sm muted">Nenhum incidente no período.</p>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center min-h-0">
          <Icon className="size-10 shrink-0" style={{ color: toneColor(tone) }} aria-hidden />
          <div className="text-xl font-semibold leading-tight break-words">{latest.title}</div>
          <div className="text-base muted">{latest.endpointName}</div>
          <span
            className="rounded-full px-3 py-1 text-xs font-semibold"
            style={{ background: toneGlow(tone), color: toneColor(tone) }}
          >
            Severidade: {meta?.label ?? "Desconhecida"}
          </span>
          {isRecurring ? (
            <p className="text-sm muted">
              <span className="font-semibold" style={{ color: toneColor("bad") }}>
                {latest.count}x
              </span>{" "}
              · primeira em {DATE_FORMATTER.format(latest.firstSeen)} · última em {DATE_TIME_FORMATTER.format(latest.lastSeen)}
            </p>
          ) : (
            <p className="text-sm muted">Detectado em {DATE_TIME_FORMATTER.format(latest.lastSeen)}</p>
          )}
        </div>
      )}
    </Card>
  );
}
