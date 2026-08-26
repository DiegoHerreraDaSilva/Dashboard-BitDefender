import type { RawRecord } from "./types";

// --- Fleet status (Network API) -------------------------------------------
//
// Confirmed against a live tenant (2026-08-24): the inventory returned by
// getNetworkInventoryItems is a folder tree — type 4 is a folder/group,
// everything else (5 = workstation, 6 = server, ...) is a leaf endpoint.
// Endpoints carry `details.isManaged`; only isManaged:true endpoints accept
// getManagedEndpointDetails (unmanaged ones reject it with "Invalid params").
// That per-endpoint call is what actually exposes `malwareStatus.infected`,
// `lastSeen`, `agent.productVersion` and `policy.applied` — none of those
// appear on the bulk inventory listing itself.

export interface FleetSummary {
  total: number;
  managedCount: number;
  unmanagedCount: number;
  // "Managed fleet health" — protected/atRisk/offline are fractions of
  // managedCount, not total. A device without an agent has nothing to
  // classify as protected/infected/offline; it's counted only in
  // unmanagedCount/unmanagedBreakdown, never folded into atRiskCount.
  protectedCount: number;
  atRiskCount: number;
  offlineCount: number;
  // Average PHASR risk score (0-100) across managed endpoints that reported
  // one; null when no managed endpoint had the field (e.g. PHASR not active).
  averageRiskScore: number | null;
  // Managed endpoints whose assigned policy isn't actually applied yet.
  noPolicyCount: number;
  unmanagedBreakdown: UnmanagedGroup[];
  agentVersions: AgentVersionGroup[];
}

export type EndpointStatus = "protected" | "atRisk" | "offline";

export interface ManagedEndpointClassification {
  status: EndpointStatus;
  riskScore: number | null;
  policyApplied: boolean;
  agentVersion: string | null;
}

function extractRiskScore(detail: RawRecord): number | null {
  const riskScore = detail.riskScore;
  if (typeof riskScore !== "object" || riskScore === null) return null;
  const value = (riskScore as RawRecord).value;
  if (typeof value !== "string") return null;
  const parsed = Number.parseFloat(value.replace("%", "").trim());
  return Number.isNaN(parsed) ? null : parsed;
}

function extractPolicyApplied(detail: RawRecord): boolean {
  const policy = detail.policy;
  if (typeof policy !== "object" || policy === null) return true;
  return (policy as RawRecord).applied !== false;
}

function extractAgentVersion(detail: RawRecord): string | null {
  const agent = detail.agent;
  if (typeof agent !== "object" || agent === null) return null;
  const version = (agent as RawRecord).productVersion;
  return typeof version === "string" ? version : null;
}

export function classifyManagedEndpoint(
  detail: RawRecord,
  offlineThresholdMs: number,
  now: number
): ManagedEndpointClassification {
  const status = ((): EndpointStatus => {
    // Offline is checked first: a `malwareStatus.infected` flag on a machine
    // that hasn't phoned home in a while is a stale last-known reading, not a
    // live threat — and GravityZone's own Control Center "Online/Offline"
    // widget splits purely on connectivity. Checking infection first (as this
    // used to) silently pulled offline-but-historically-infected machines out
    // of the offline bucket, undercounting it against the Control Center's
    // own numbers (confirmed live: our Offline was short by exactly the
    // count in "Em risco").
    const lastSeenRaw = detail.lastSeen;
    if (typeof lastSeenRaw === "string") {
      const lastSeen = Date.parse(lastSeenRaw);
      if (!Number.isNaN(lastSeen) && now - lastSeen > offlineThresholdMs) return "offline";
    }

    const malwareStatus = detail.malwareStatus;
    if (typeof malwareStatus === "object" && malwareStatus !== null) {
      if ((malwareStatus as RawRecord).infected === true) return "atRisk";
    }

    return "protected";
  })();

  return {
    status,
    riskScore: extractRiskScore(detail),
    policyApplied: extractPolicyApplied(detail),
    agentVersion: extractAgentVersion(detail),
  };
}

// --- Unmanaged breakdown ----------------------------------------------------
//
// A device known to the inventory without a working agent isn't one
// homogenous risk bucket — a Windows machine missing the agent is a work
// item; a printer or switch picked up by network discovery is noise with no
// action attached. operatingSystemVersion is the only confirmed field that
// lets us tell them apart; exact device-type codes for non-computer hardware
// are unconfirmed on this tenant (none observed in sampling so far).

export type UnmanagedCategory = "server" | "workstation" | "other" | "unidentified";

export interface UnmanagedGroup {
  category: UnmanagedCategory;
  count: number;
}

export const UNMANAGED_CATEGORY_LABELS: Record<UnmanagedCategory, { label: string; action: string }> = {
  server: { label: "Servidor sem agente", action: "Instalar agente" },
  workstation: { label: "Estação sem agente", action: "Instalar agente" },
  other: { label: "Outro sistema sem agente", action: "Instalar agente" },
  unidentified: { label: "Dispositivo não identificado", action: "Sem ação (descoberta de rede)" },
};

function classifyUnmanagedCategory(item: RawRecord): UnmanagedCategory {
  const details = typeof item.details === "object" && item.details !== null ? (item.details as RawRecord) : {};
  const os = details.operatingSystemVersion;
  if (typeof os !== "string" || os.trim() === "") return "unidentified";
  const normalized = os.toLowerCase();
  if (normalized.startsWith("windows server")) return "server";
  if (normalized.startsWith("windows")) return "workstation";
  return "other";
}

export function classifyUnmanaged(items: RawRecord[]): UnmanagedGroup[] {
  const counts = new Map<UnmanagedCategory, number>();
  for (const item of items) {
    const category = classifyUnmanagedCategory(item);
    counts.set(category, (counts.get(category) ?? 0) + 1);
  }
  return (Object.keys(UNMANAGED_CATEGORY_LABELS) as UnmanagedCategory[])
    .map((category) => ({ category, count: counts.get(category) ?? 0 }))
    .filter((group) => group.count > 0)
    .sort((a, b) => b.count - a.count);
}

// --- Agent version breakdown -------------------------------------------------
//
// No official "latest version" reference is exposed by the API (no release
// feed to check against), so the newest version number actually seen running
// somewhere in the fleet is treated as the target — a dot-separated numeric
// compare (e.g. "8.26.8.659" > "8.26.8.654"), not a popularity vote. A
// version being rare doesn't make it outdated; being older than what's
// already deployed elsewhere does.

export interface AgentVersionGroup {
  version: string;
  count: number;
  isLatest: boolean;
}

export function compareVersions(a: string, b: string): number {
  const partsA = a.split(".").map((n) => Number.parseInt(n, 10) || 0);
  const partsB = b.split(".").map((n) => Number.parseInt(n, 10) || 0);
  const length = Math.max(partsA.length, partsB.length);
  for (let i = 0; i < length; i++) {
    const diff = (partsA[i] ?? 0) - (partsB[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

export function classifyAgentVersions(versions: string[]): AgentVersionGroup[] {
  const counts = new Map<string, number>();
  for (const version of versions) {
    counts.set(version, (counts.get(version) ?? 0) + 1);
  }
  const entries = Array.from(counts.entries()).map(([version, count]) => ({ version, count }));
  const latestVersion = entries.reduce(
    (latest, entry) => (compareVersions(entry.version, latest) > 0 ? entry.version : latest),
    entries[0]?.version ?? ""
  );

  return entries
    .map((entry) => ({ ...entry, isLatest: entry.version === latestVersion }))
    .sort((a, b) => (a.isLatest !== b.isLatest ? (a.isLatest ? -1 : 1) : b.count - a.count));
}

export function summarizeFleet(managed: ManagedEndpointClassification[], unmanagedItems: RawRecord[]): FleetSummary {
  let protectedCount = 0;
  let atRiskCount = 0;
  let offlineCount = 0;
  let noPolicyCount = 0;
  const riskScores: number[] = [];
  const agentVersions: string[] = [];

  for (const entry of managed) {
    if (entry.status === "protected") protectedCount++;
    else if (entry.status === "atRisk") atRiskCount++;
    else offlineCount++;

    if (!entry.policyApplied) noPolicyCount++;
    if (entry.riskScore !== null) riskScores.push(entry.riskScore);
    if (entry.agentVersion !== null) agentVersions.push(entry.agentVersion);
  }

  const averageRiskScore =
    riskScores.length > 0 ? Math.round(riskScores.reduce((sum, value) => sum + value, 0) / riskScores.length) : null;

  return {
    total: managed.length + unmanagedItems.length,
    managedCount: managed.length,
    unmanagedCount: unmanagedItems.length,
    protectedCount,
    atRiskCount,
    offlineCount,
    averageRiskScore,
    noPolicyCount,
    unmanagedBreakdown: classifyUnmanaged(unmanagedItems),
    agentVersions: classifyAgentVersions(agentVersions),
  };
}

// --- Incidents (Incidents API) ---------------------------------------------
//
// Confirmed against Bitdefender's official getIncidentsList reference
// (bitdefender.com/business/support/en/77209-1463999-getincidentslist.html)
// AND a live tenant (2026-08-24): items carry `incidentId`, top-level
// `attackTypes` (array of strings), `priority` (unknown/low/medium/high/
// critical), `severityScore` (1-100), `created` (ISO-8601), `incidentType`
// (incident | extendedIncident), and a `details` object whose shape depends
// on incidentType — endpoint incidents have `details.detectionName` and
// `details.computerName`; organization incidents involve many entities and
// have neither. On this tenant `priority` is always "unknown" (never
// triaged), so severity falls back to banding the numeric `severityScore`,
// which does carry real signal.

export type IncidentSeverity = "critical" | "high" | "medium" | "low" | "unknown";

// One unified feed instead of two: a chronological "what got flagged" list
// hides the actual story (the same endpoint hit repeatedly by variants of the
// same detection family), and a recurrence-only list drops singletons and
// organization incidents entirely. Every incident in the tenant's history
// lands in exactly one entry here — grouped by (endpoint, detection family)
// when both are known, count 1 otherwise — sorted by most recent activity.
export interface IncidentActivityEntry {
  id: string;
  title: string;
  endpointName: string;
  severity: IncidentSeverity;
  count: number;
  firstSeen: Date;
  lastSeen: Date;
}

function normalizePriority(raw: unknown): IncidentSeverity {
  if (typeof raw !== "string") return "unknown";
  const value = raw.toLowerCase();
  if (value === "critical" || value === "high" || value === "medium" || value === "low") return value;
  return "unknown";
}

function severityFromScore(raw: unknown): IncidentSeverity {
  if (typeof raw !== "number") return "unknown";
  if (raw >= 80) return "critical";
  if (raw >= 60) return "high";
  if (raw >= 30) return "medium";
  return "low";
}

const SEVERITY_RANK: Record<IncidentSeverity, number> = { critical: 4, high: 3, medium: 2, low: 1, unknown: 0 };

function worseSeverity(a: IncidentSeverity, b: IncidentSeverity): IncidentSeverity {
  return SEVERITY_RANK[b] > SEVERITY_RANK[a] ? b : a;
}

// `extendedIncident` (Bitdefender's cross-entity correlation engine) doesn't
// imply "affects many endpoints" — confirmed live on this tenant: every
// extendedIncident sampled had `details.counters.endpoints === 1` (the
// correlation was across entity *types* — a domain, an external source —
// not across machines). `details` never carries a computerName for this
// incident type, so the specific endpoint can't be named, but the real
// count is right there in `counters` and should drive the wording instead
// of an unconditional plural.
function orgIncidentEndpointLabel(details: RawRecord): string {
  const counters = typeof details.counters === "object" && details.counters !== null ? (details.counters as RawRecord) : {};
  const endpointCount = typeof counters.endpoints === "number" ? counters.endpoints : null;
  if (endpointCount === 1) return "1 endpoint";
  if (endpointCount !== null) return `${endpointCount} endpoints`;
  return "Vários endpoints";
}

function isNoiseSegment(segment: string): boolean {
  return /^[0-9a-f]{5,}$/i.test(segment) || /^\d+$/.test(segment);
}

// Heuristic, not a documented API concept — validate against real families
// and adjust if it over- or under-merges distinct detections. Confirmed on a
// live tenant: an engine-tag prefix like "CMD:" or "JS:" (command-line vs.
// script heuristic engine) can precede the same family name — stripped first
// so "CMD:Heur.BZC.Boxter.541.82218742" and "Heur.BZC.Boxter.797.93A81C8E"
// both resolve to "Heur.BZC.Boxter" instead of splitting into two groups.
function detectionFamily(detectionName: string): string {
  const withoutEnginePrefix = detectionName.replace(/^[A-Za-z]+:/, "");
  const segments = withoutEnginePrefix.split(".");
  while (segments.length > 2 && isNoiseSegment(segments[segments.length - 1])) {
    segments.pop();
  }
  return segments.join(".");
}

export function classifyIncidentActivity(rawIncidents: RawRecord[]): IncidentActivityEntry[] {
  const groups = new Map<string, IncidentActivityEntry>();
  let ungroupedSeq = 0;

  for (const item of rawIncidents) {
    const created = typeof item.created === "string" ? new Date(item.created) : null;
    if (!created || Number.isNaN(created.getTime())) continue;

    const details = typeof item.details === "object" && item.details !== null ? (item.details as RawRecord) : {};

    // GravityZone itself flags this: an endpoint incident that's `partOf` a
    // broader organization incident isn't its own case — it's already
    // represented by that parent. Counting both inflates the total (28 raw
    // items vs. 23 in the Control Center's own incident list, confirmed
    // live on this tenant) and would double-report the same real event.
    if (Array.isArray(details.partOf) && details.partOf.length > 0) continue;

    const attackTypes = Array.isArray(item.attackTypes) ? (item.attackTypes as unknown[]) : [];
    const isOrgIncident = item.incidentType === "extendedIncident";
    const detectionName = typeof details.detectionName === "string" ? details.detectionName : null;
    const endpointName = typeof details.computerName === "string" ? details.computerName : null;

    const priority = normalizePriority(item.priority);
    const severity = priority !== "unknown" ? priority : severityFromScore(item.severityScore);

    const key = endpointName && detectionName ? `${endpointName}::${detectionFamily(detectionName)}` : null;

    if (!key) {
      ungroupedSeq += 1;
      const title = String(
        detectionName ??
          (attackTypes.length > 0 ? attackTypes.join(", ") : null) ??
          (isOrgIncident ? "Incidente organizacional" : "Incidente sem nome")
      );
      groups.set(`ungrouped-${ungroupedSeq}`, {
        id: String(item.incidentId ?? `incident-${ungroupedSeq}`),
        title,
        endpointName: isOrgIncident ? orgIncidentEndpointLabel(details) : endpointName ?? "Endpoint desconhecido",
        severity,
        count: 1,
        firstSeen: created,
        lastSeen: created,
      });
      continue;
    }

    const existing = groups.get(key);
    if (existing) {
      existing.count += 1;
      existing.severity = worseSeverity(existing.severity, severity);
      if (created < existing.firstSeen) existing.firstSeen = created;
      if (created > existing.lastSeen) existing.lastSeen = created;
    } else {
      groups.set(key, {
        id: key,
        title: detectionFamily(detectionName as string),
        endpointName: endpointName as string,
        severity,
        count: 1,
        firstSeen: created,
        lastSeen: created,
      });
    }
  }

  return Array.from(groups.values()).sort((a, b) => b.lastSeen.getTime() - a.lastSeen.getTime());
}

// --- Licensing (Licensing API) ----------------------------------------------
//
// Confirmed against Bitdefender's official getLicenseInfo reference
// (bitdefender.com/business/support/en/77209-127105-getlicenseinfo.html):
// the result is an ARRAY of per-product license entries (usedSlots,
// totalSlots, expiryDate, assignedProductType, ...) — but confirmed on a live
// tenant (default params, no returnAllProducts) it actually comes back as a
// single flat object. licensing.ts handles both shapes before calling this.

export interface LicenseSummary {
  used: number | null;
  total: number | null;
  expiresAt: Date | null;
}

export function toLicenseSummary(raw: RawRecord): LicenseSummary {
  const used = raw.usedSlots;
  const total = raw.totalSlots;
  const expiresRaw = raw.expiryDate;

  return {
    used: typeof used === "number" ? used : null,
    total: typeof total === "number" ? total : null,
    expiresAt:
      typeof expiresRaw === "string" && !Number.isNaN(Date.parse(expiresRaw)) ? new Date(expiresRaw) : null,
  };
}

// --- Company risk score (Companies API) -------------------------------------
//
// Confirmed live on this tenant (2026-08-24): getCompanyDetails takes no
// companyId param — the API key is scoped to exactly one company, so it just
// returns that company's own details. Its `riskScore` object is the same
// "Company Risk Score" shown in Control Center's "Estado da empresa" widget:
// { value: "20%", impact: "Baixa", misconfigurations: "84%",
//   appVulnerabilities: "12%", humanRisks: "4%", industryModifier: "0%" }.
// `impact` comes back already localized to the tenant's language (matches
// PHASR's `impact` field behavior) — Baixa/Média/Alta, not a code to map.
// The Control Center UI additionally breaks the score into "Pontuação de
// recursos"/"Pontuação da conta" sub-totals that aren't present in this
// response — not shown here rather than guessed.

export type CompanyRiskImpact = "Baixa" | "Média" | "Alta" | "Desconhecida";

export interface CompanyRiskSummary {
  score: number | null;
  impact: CompanyRiskImpact;
  findings: number | null; // riskScore.misconfigurations
  vulnerabilities: number | null; // riskScore.appVulnerabilities
  accountRisks: number | null; // riskScore.humanRisks
}

function parsePercent(raw: unknown): number | null {
  if (typeof raw !== "string") return null;
  const value = Number.parseFloat(raw.replace("%", "").trim());
  return Number.isNaN(value) ? null : value;
}

export function toCompanyRiskSummary(raw: RawRecord): CompanyRiskSummary {
  const riskScore = typeof raw.riskScore === "object" && raw.riskScore !== null ? (raw.riskScore as RawRecord) : {};
  const impactRaw = typeof riskScore.impact === "string" ? riskScore.impact : null;
  const impact: CompanyRiskImpact =
    impactRaw === "Baixa" || impactRaw === "Média" || impactRaw === "Alta" ? impactRaw : "Desconhecida";

  return {
    score: parsePercent(riskScore.value),
    impact,
    findings: parsePercent(riskScore.misconfigurations),
    vulnerabilities: parsePercent(riskScore.appVulnerabilities),
    accountRisks: parsePercent(riskScore.humanRisks),
  };
}
