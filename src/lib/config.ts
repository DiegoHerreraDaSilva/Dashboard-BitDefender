function parseInt_(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function parseBool(name: string, fallback: boolean): boolean {
  const raw = process.env[name];
  if (raw === undefined) return fallback;
  return raw.toLowerCase() === "true";
}

// Plain, non-secret settings: safe to read eagerly at module load, since they
// always have defaults and never throw. This keeps `next build` (which loads
// route modules without real env vars present) from failing.
export const dashboardRefreshSeconds = parseInt_("DASHBOARD_REFRESH_SECONDS", 60);
export const cacheTtlSeconds = parseInt_("CACHE_TTL_SECONDS", 60);
export const requestTimeoutMs = parseInt_("REQUEST_TIMEOUT_MS", 10_000);
export const maxRetries429 = parseInt_("MAX_RETRIES_429", 3);
export const offlineThresholdMinutes = parseInt_("OFFLINE_THRESHOLD_MINUTES", 480);
export const licenseExpiryWarningDays = parseInt_("LICENSE_EXPIRY_WARNING_DAYS", 30);
export const licenseExpiryCriticalDays = parseInt_("LICENSE_EXPIRY_CRITICAL_DAYS", 7);
export const licenseUsageWarningPercent = parseInt_("LICENSE_USAGE_WARNING_PERCENT", 85);
export const licenseUsageCriticalPercent = parseInt_("LICENSE_USAGE_CRITICAL_PERCENT", 95);
export const enableDebugRoute = parseBool("ENABLE_DEBUG_ROUTE", false);

export interface GravityZoneCredentials {
  accessUrl: string;
  apiKey: string;
}

let cachedCredentials: GravityZoneCredentials | null = null;

// Secrets are validated lazily, on first real use (first GravityZone call),
// not at module load — so a missing .env.local fails loudly on the first
// request instead of breaking `next build`.
export function getGravityZoneCredentials(): GravityZoneCredentials {
  if (cachedCredentials) return cachedCredentials;

  const accessUrl = process.env.GRAVITYZONE_ACCESS_URL;
  const apiKey = process.env.GRAVITYZONE_API_KEY;

  if (!accessUrl) {
    throw new Error("Missing required environment variable: GRAVITYZONE_ACCESS_URL");
  }
  if (!apiKey) {
    throw new Error("Missing required environment variable: GRAVITYZONE_API_KEY");
  }

  cachedCredentials = { accessUrl: accessUrl.replace(/\/+$/, ""), apiKey };
  return cachedCredentials;
}

export function maskApiKey(apiKey: string): string {
  return apiKey.length <= 4 ? "****" : `****${apiKey.slice(-4)}`;
}
