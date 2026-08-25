import { SnapshotCache } from "@/lib/cache";
import { cacheTtlSeconds } from "@/lib/config";
import { callMethod } from "./client";
import { toLicenseSummary, type LicenseSummary } from "./classify";
import type { RawRecord } from "./types";

const ENDPOINT_SECURITY_PRODUCT_TYPE = 0;

// Bitdefender's official getLicenseInfo reference describes the result as an
// array of per-product license entries — but confirmed against a live
// tenant (with default params, no returnAllProducts) it's actually a single
// flat object. Handling both shapes: if it ever does come back as an array
// (e.g. returnAllProducts:true in the future), prefer an explicit Endpoint
// Security entry (assignedProductType 0) when more than one is present.
function pickRelevantLicense(raw: unknown): RawRecord {
  if (Array.isArray(raw)) {
    const entries = raw as RawRecord[];
    return entries.find((entry) => entry.assignedProductType === ENDPOINT_SECURITY_PRODUCT_TYPE) ?? entries[0] ?? {};
  }
  if (typeof raw === "object" && raw !== null) {
    return raw as RawRecord;
  }
  return {};
}

async function fetchLicense(): Promise<LicenseSummary> {
  const raw = await callMethod<unknown>("licensing", "getLicenseInfo", {});
  const entry = pickRelevantLicense(raw);
  if (Object.keys(entry).length === 0) {
    console.warn("[gravityzone] Unexpected getLicenseInfo shape:", typeof raw);
    return { used: null, total: null, expiresAt: null };
  }
  return toLicenseSummary(entry);
}

export const licenseCache = new SnapshotCache(cacheTtlSeconds * 1000, fetchLicense);
