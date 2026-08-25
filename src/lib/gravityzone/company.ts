import { SnapshotCache } from "@/lib/cache";
import { cacheTtlSeconds } from "@/lib/config";
import { callMethod } from "./client";
import { toCompanyRiskSummary, type CompanyRiskSummary } from "./classify";
import type { RawRecord } from "./types";

// Companies API v1.0. Confirmed live: the API key is scoped to one company,
// so getCompanyDetails takes no params and just returns that company.
async function fetchCompanyRisk(): Promise<CompanyRiskSummary> {
  const raw = await callMethod<RawRecord>("companies", "getCompanyDetails", {});
  return toCompanyRiskSummary(raw);
}

export const companyCache = new SnapshotCache(cacheTtlSeconds * 1000, fetchCompanyRisk);
