import { SnapshotCache } from "@/lib/cache";
import { cacheTtlSeconds } from "@/lib/config";
import { callMethod } from "./client";
import { classifyIncidentActivity, type IncidentActivityEntry } from "./classify";
import { incidentsListResponseSchema, type RawRecord } from "./types";

const PER_PAGE = 100;
const MAX_PAGES = 100; // safety cap over the whole incident history, not a rolling window

// getIncidentsList requires startDate/endDate together — there's no "no
// filter" mode — so "all of history" is expressed as a fixed start far
// before GravityZone Cloud existed, through now.
const HISTORY_START = new Date(0).toISOString();

export interface IncidentsSummary {
  activity: IncidentActivityEntry[];
}

// Confirmed against Bitdefender's official reference and a live tenant:
// getIncidentsList lives on v1.2 (not v1.0/v1.1 — those return "Method not
// found"/"Invalid params" for it). perPage must be >= 10 per the docs.
// startDate/endDate (ISO-8601, both required together) scope the query to a
// lookback window — the docs list them as top-level params, but the real API
// only accepts them nested under `filters`; top-level throws "Invalid params".
async function fetchIncidentsInWindow(startDate: string, endDate: string): Promise<RawRecord[]> {
  const items: RawRecord[] = [];

  for (let page = 1; page <= MAX_PAGES; page++) {
    const raw = await callMethod<unknown>(
      "incidents",
      "getIncidentsList",
      { page, perPage: PER_PAGE, filters: { startDate, endDate } },
      { version: "v1.2" }
    );

    const parsed = incidentsListResponseSchema.safeParse(raw);
    if (!parsed.success) {
      console.warn(
        "[gravityzone] Unexpected getIncidentsList shape:",
        raw && typeof raw === "object" ? Object.keys(raw) : typeof raw
      );
      break;
    }

    const pageItems = parsed.data.items ?? [];
    items.push(...pageItems);
    if (pageItems.length < PER_PAGE) break;
  }

  return items;
}

async function fetchIncidentsSummary(): Promise<IncidentsSummary> {
  const items = await fetchIncidentsInWindow(HISTORY_START, new Date().toISOString());
  return { activity: classifyIncidentActivity(items) };
}

export const incidentsCache = new SnapshotCache(cacheTtlSeconds * 1000, fetchIncidentsSummary);
