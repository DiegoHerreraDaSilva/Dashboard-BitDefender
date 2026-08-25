import { HelpCircle, Laptop, Server, ShieldOff } from "lucide-react";
import { Card, toneColor, type CardTone } from "@/components/ui/Card";
import type { SnapshotState } from "@/lib/cache";
import { UNMANAGED_CATEGORY_LABELS, type FleetSummary, type UnmanagedCategory } from "@/lib/gravityzone/classify";

interface UnmanagedBreakdownProps {
  state: SnapshotState<FleetSummary>;
  className?: string;
}

const CATEGORY_ICON: Record<UnmanagedCategory, typeof Server> = {
  server: Server,
  workstation: Laptop,
  other: ShieldOff,
  unidentified: HelpCircle,
};

// Brand (teal), not warn (amber) — this is a tracked backlog item ("install
// an agent"), not something actively broken right now. Amber/red are
// reserved for the health/incident cards so a real active problem never has
// to compete visually with routine inventory work.
const CATEGORY_TONE: Record<UnmanagedCategory, CardTone> = {
  server: "brand",
  workstation: "brand",
  other: "brand",
  unidentified: "neutral",
};

// Turns an opaque, alarming count into a work queue: which of these need an
// agent installed, and which are just network-discovery noise (printers,
// switches) with nothing to act on. Confirmed on a live tenant: every leaf
// item in this tenant's inventory is type 5 (workstation) or 6 (server), and
// every unmanaged item carries a Windows operatingSystemVersion string — no
// printer/switch/IP-phone-type entries exist here, so those categories never
// show up in practice; "unidentified" (no OS string at all) is what would
// carry that kind of noise if this tenant's Network module ever surfaced it.
export function UnmanagedBreakdown({ state, className }: UnmanagedBreakdownProps) {
  const summary = state.status === "error" ? null : state.data;
  const groups = summary?.unmanagedBreakdown ?? [];

  return (
    <Card className={`p-6 flex flex-col gap-4 ${className ?? ""}`}>
      <h2 className="text-lg font-semibold tracking-tight">Não gerenciados, por tipo</h2>
      {!summary ? (
        <p className="text-sm muted">Conectando à GravityZone...</p>
      ) : groups.length === 0 ? (
        <p className="text-sm muted">Nenhum dispositivo não gerenciado.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {groups.map((group) => {
            const meta = UNMANAGED_CATEGORY_LABELS[group.category];
            const tone = CATEGORY_TONE[group.category];
            const Icon = CATEGORY_ICON[group.category];
            return (
              <li key={group.category} className="flex items-center justify-between gap-4 text-base">
                <div className="flex items-center gap-2 min-w-0">
                  <Icon className="size-4 shrink-0" style={{ color: toneColor(tone) }} aria-hidden />
                  <span className="truncate font-medium">{meta.label}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-semibold tabular-nums">{group.count}</span>
                  <span className="text-xs muted">{meta.action}</span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
