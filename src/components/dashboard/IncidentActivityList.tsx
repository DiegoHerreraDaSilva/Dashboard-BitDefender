import { AlertTriangle, Info, Repeat2, ShieldAlert, ShieldQuestion } from "lucide-react";
import { Card, toneColor, type CardTone } from "@/components/ui/Card";
import type { SnapshotState } from "@/lib/cache";
import type { IncidentActivityEntry, IncidentSeverity } from "@/lib/gravityzone/classify";
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

const MAX_ROWS_SHOWN = 8;

function IncidentRow({ entry }: { entry: IncidentActivityEntry }) {
  const isRecurring = entry.count >= 2;
  const meta = SEVERITY_META[entry.severity];
  const Icon = isRecurring ? Repeat2 : meta.Icon;
  const color = isRecurring ? "var(--bad)" : toneColor(meta.tone);
  return (
    <li className="flex items-center justify-between gap-4 text-base">
      <div className="flex items-center gap-2 min-w-0">
        <Icon className="size-4 shrink-0" style={{ color }} aria-hidden />
        <span className="truncate font-medium">{entry.title}</span>
        <span className="truncate muted">· {entry.endpointName}</span>
      </div>
      <div className="flex items-center gap-3 shrink-0 tabular-nums">
        {isRecurring ? (
          <>
            <span className="font-semibold" style={{ color: "var(--bad)" }}>
              {entry.count}x
            </span>
            <span className="text-xs muted">desde {DATE_FORMATTER.format(entry.firstSeen)}</span>
          </>
        ) : (
          <span className="muted">{TIME_FORMATTER.format(entry.lastSeen)}</span>
        )}
      </div>
    </li>
  );
}

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
  // Two flex columns, not CSS columns-2 — this browser doesn't support CSS
  // multi-column layout (confirmed: it doesn't even support grid), so the
  // split is done in plain JS instead.
  const splitAt = Math.ceil(shown.length / 2);
  const leftColumn = shown.slice(0, splitAt);
  const rightColumn = shown.slice(splitAt);

  return (
    <Card className={`p-6 flex flex-col gap-4 ${className ?? ""}`}>
      <h2 className="text-lg font-semibold tracking-tight">Incidentes (histórico completo)</h2>
      {state.status === "error" ? (
        <p className="text-sm muted">Conectando à GravityZone...</p>
      ) : entries.length === 0 ? (
        <p className="text-sm muted">Nenhum incidente no período.</p>
      ) : (
        <>
          <div className="flex gap-8">
            <ul className="flex-1 min-w-0 flex flex-col gap-3">
              {leftColumn.map((entry) => (
                <IncidentRow key={entry.id} entry={entry} />
              ))}
            </ul>
            <ul className="flex-1 min-w-0 flex flex-col gap-3">
              {rightColumn.map((entry) => (
                <IncidentRow key={entry.id} entry={entry} />
              ))}
            </ul>
          </div>
          {hiddenCount > 0 ? <p className="text-xs muted -mt-2">+{hiddenCount} outros incidentes</p> : null}
        </>
      )}
    </Card>
  );
}
