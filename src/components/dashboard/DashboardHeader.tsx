import { LiveClock } from "./LiveClock";
import { SyncStatus } from "./SyncStatus";
import type { SnapshotState } from "@/lib/cache";

interface DashboardHeaderProps {
  renderedAt: Date;
  syncStates: SnapshotState<unknown>[];
}

const DATE_FORMATTER = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "America/Sao_Paulo",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

export function DashboardHeader({ renderedAt, syncStates }: DashboardHeaderProps) {
  return (
    <header className="flex items-center justify-between">
      <div>
        <p className="text-lg font-semibold tracking-wide" style={{ color: "var(--brand)" }}>
          SCHWABEN ENGINEERING
        </p>
        <h1 className="text-5xl font-semibold tracking-tight">Status de Segurança — GravityZone</h1>
      </div>
      <div className="text-right flex flex-col items-end gap-1">
        <LiveClock initial={renderedAt} className="text-4xl font-semibold tabular-nums" />
        <div className="text-lg muted">{DATE_FORMATTER.format(renderedAt)}</div>
        <SyncStatus states={syncStates} now={renderedAt} />
      </div>
    </header>
  );
}
