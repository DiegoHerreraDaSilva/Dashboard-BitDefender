import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { cacheTtlSeconds, dashboardRefreshSeconds } from "@/lib/config";
import type { SnapshotState } from "@/lib/cache";

interface SyncStatusProps {
  states: SnapshotState<unknown>[];
  now: Date;
}

function oldestFetchedAt(states: SnapshotState<unknown>[]): Date | null {
  let oldest: Date | null = null;
  for (const state of states) {
    if (state.status === "error") continue;
    if (!oldest || state.fetchedAt < oldest) oldest = state.fetchedAt;
  }
  return oldest;
}

// Always visible, unlike a banner that only appears once something is
// already wrong — a frozen dashboard that still *looks* live is worse than
// one that's visibly down. Recomputed on every meta-refresh reload (every
// DASHBOARD_REFRESH_SECONDS), so it lags real backend death by at most a
// couple of reload cycles — an acceptable resolution for a wall display.
export function SyncStatus({ states, now }: SyncStatusProps) {
  const neverSyncedCount = states.filter((state) => state.status === "error").length;
  const neverSynced = neverSyncedCount > 0;
  const oldest = oldestFetchedAt(states);

  if (neverSynced && !oldest) {
    return (
      <div className="flex items-center gap-1.5 text-base" style={{ color: "var(--bad)" }}>
        <XCircle className="size-3.5 shrink-0" aria-hidden />
        Nunca sincronizado
      </div>
    );
  }

  const ageMs = oldest ? now.getTime() - oldest.getTime() : Number.POSITIVE_INFINITY;
  const ageMinutes = Math.max(0, Math.round(ageMs / 60_000));
  const expectedMs = Math.max(cacheTtlSeconds, dashboardRefreshSeconds) * 1000;

  const tone: "ok" | "warn" | "bad" =
    neverSynced || ageMs > expectedMs * 4 ? "bad" : ageMs > expectedMs * 2 ? "warn" : "ok";
  const color = tone === "ok" ? "var(--ok)" : tone === "warn" ? "var(--warn)" : "var(--bad)";
  const Icon = tone === "ok" ? CheckCircle2 : AlertTriangle;
  const label = neverSynced
    ? `Atualizado há ${ageMinutes} min (${neverSyncedCount} ${neverSyncedCount === 1 ? "domínio nunca sincronizou" : "domínios nunca sincronizaram"})`
    : `Atualizado há ${ageMinutes} min`;

  return (
    <div className="flex items-center gap-1.5 text-base" style={{ color }}>
      <Icon className="size-3.5 shrink-0" aria-hidden />
      {label}
    </div>
  );
}
