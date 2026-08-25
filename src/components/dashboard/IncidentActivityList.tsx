import { AlertTriangle, Info, Repeat2, ShieldAlert, ShieldQuestion } from "lucide-react";
import { Card, toneColor, type CardTone } from "@/components/ui/Card";
import type { SnapshotState } from "@/lib/cache";
import type { IncidentSeverity } from "@/lib/gravityzone/classify";
import type { IncidentsSummary } from "@/lib/gravityzone/incidents";

interface IncidentActivityListProps {
  state: SnapshotState<IncidentsSummary>;
  className?: string;
}

const SEVERITY_META: Record<IncidentSeverity, { tone: CardTone; Icon: typeof ShieldAlert }> = {
  critical: { tone: "bad", Icon: ShieldAlert },
  high: { tone: "bad", Icon: ShieldAlert },
  medium: { tone: "warn", Icon: AlertTriangle },
  low: { tone: "brand", Icon: Info },
  unknown: { tone: "neutral", Icon: ShieldQuestion },
};

const DATE_FORMATTER = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  day: "2-digit",
  month: "2-digit",
});

const TIME_FORMATTER = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

const MAX_ROWS_SHOWN = 6;

// One feed instead of two competing lists: every incident in GravityZone's
// history shows up exactly once, most recent activity first. A repeated
// (endpoint, detection family) collapses into a single row with a count —
// that's the recurrence signal — while a one-off still shows up with its
// timestamp instead of disappearing into a separate card.
export function IncidentActivityList({ state, className }: IncidentActivityListProps) {
  const entries = state.status === "error" ? [] : state.data.activity;
  const shown = entries.slice(0, MAX_ROWS_SHOWN);
  // Count real incident occurrences hidden, not hidden rows — a hidden
  // recurring group ("2x") represents 2 incidents, not 1.
  const hiddenCount = entries.slice(MAX_ROWS_SHOWN).reduce((sum, entry) => sum + entry.count, 0);

  return (
    <Card className={`p-6 flex flex-col gap-4 ${className ?? ""}`}>
      <h2 className="text-2xl font-semibold tracking-tight">Incidentes (histórico completo)</h2>
      {state.status === "error" ? (
        <p className="text-lg muted">Conectando à GravityZone...</p>
      ) : entries.length === 0 ? (
        <p className="text-lg muted">Nenhum incidente no período.</p>
      ) : (
        <>
          <ul className="columns-2 gap-8">
            {shown.map((entry) => {
              const isRecurring = entry.count >= 2;
              const meta = SEVERITY_META[entry.severity];
              const Icon = isRecurring ? Repeat2 : meta.Icon;
              const color = isRecurring ? "var(--bad)" : toneColor(meta.tone);
              return (
                <li key={entry.id} className="flex items-center justify-between gap-4 text-2xl break-inside-avoid mb-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <Icon className="size-5 shrink-0" style={{ color }} aria-hidden />
                    <span className="truncate font-medium">{entry.title}</span>
                    <span className="truncate muted">· {entry.endpointName}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 tabular-nums">
                    {isRecurring ? (
                      <>
                        <span className="font-semibold" style={{ color: "var(--bad)" }}>
                          {entry.count}x
                        </span>
                        <span className="text-xl muted">desde {DATE_FORMATTER.format(entry.firstSeen)}</span>
                      </>
                    ) : (
                      <span className="muted">{TIME_FORMATTER.format(entry.lastSeen)}</span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
          {hiddenCount > 0 ? <p className="text-lg muted -mt-2">+{hiddenCount} outros incidentes</p> : null}
        </>
      )}
    </Card>
  );
}
