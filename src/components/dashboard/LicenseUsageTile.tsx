import { KeyRound } from "lucide-react";
import { Card, toneColor, type CardTone } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import {
  licenseExpiryCriticalDays,
  licenseExpiryWarningDays,
  licenseUsageCriticalPercent,
  licenseUsageWarningPercent,
} from "@/lib/config";
import type { SnapshotState } from "@/lib/cache";
import type { LicenseSummary } from "@/lib/gravityzone/classify";

interface LicenseUsageTileProps {
  state: SnapshotState<LicenseSummary>;
  now: Date;
  className?: string;
}

// UTC, not America/Sao_Paulo: expiryDate is a calendar date ("license expires
// on this day"), not an instant — GravityZone's own wire format for it isn't
// publicly documented, and if it comes back date-only (e.g. "2026-12-31"),
// JS parses that as UTC midnight. Formatting in BRT (UTC-3) would then roll
// it back to the previous day. Formatting in UTC always shows the calendar
// date as sent, whether the field is date-only or a full timestamp.
const DATE_FORMATTER = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "UTC",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const TONE_RANK: Record<CardTone, number> = { neutral: 0, brand: 0, ok: 1, warn: 2, bad: 3 };

function worseTone(a: CardTone, b: CardTone): CardTone {
  return TONE_RANK[a] >= TONE_RANK[b] ? a : b;
}

function expiryTone(daysLeft: number | null): CardTone {
  if (daysLeft === null) return "neutral";
  if (daysLeft <= licenseExpiryCriticalDays) return "bad";
  if (daysLeft <= licenseExpiryWarningDays) return "warn";
  return "ok";
}

// A license running out of seats is at least as urgent as one running out of
// time — "3 assentos livres" matters today, "expira em 2 anos" doesn't.
function usageTone(used: number | null, total: number | null): CardTone {
  if (used === null || total === null || total <= 0) return "neutral";
  const percentUsed = (used / total) * 100;
  if (percentUsed >= licenseUsageCriticalPercent) return "bad";
  if (percentUsed >= licenseUsageWarningPercent) return "warn";
  return "ok";
}

export function LicenseUsageTile({ state, now, className }: LicenseUsageTileProps) {
  const license = state.status === "error" ? null : state.data;
  const daysLeft = license?.expiresAt ? Math.ceil((license.expiresAt.getTime() - now.getTime()) / 86_400_000) : null;
  const hasCounts = license && license.used !== null && license.total !== null;
  const tone = worseTone(usageTone(license?.used ?? null, license?.total ?? null), expiryTone(daysLeft));

  return (
    <Card tone={tone} className={`p-6 flex flex-col gap-4 ${className ?? ""}`}>
      <h2 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
        <KeyRound className="size-5" style={{ color: toneColor(tone) }} aria-hidden />
        Licenciamento
      </h2>
      {!hasCounts ? (
        <p className="text-lg muted">Conectando à GravityZone...</p>
      ) : (
        <>
          <div className="text-4xl font-semibold tabular-nums">
            {license.used} / {license.total} <span className="text-lg font-normal muted">assentos</span>
          </div>
          <ProgressBar value={license.used!} max={license.total!} tone={tone} />
          <p className="text-lg muted">
            {license.expiresAt
              ? `Expira em ${DATE_FORMATTER.format(license.expiresAt)}${daysLeft !== null ? ` (${daysLeft} dias)` : ""}`
              : "Data de expiração não disponível"}
          </p>
        </>
      )}
    </Card>
  );
}
