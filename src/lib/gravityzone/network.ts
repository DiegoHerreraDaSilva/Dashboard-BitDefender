import { SnapshotCache } from "@/lib/cache";
import { cacheTtlSeconds, offlineThresholdMinutes } from "@/lib/config";
import { callMethod } from "./client";
import {
  classifyManagedEndpoint,
  summarizeFleet,
  type FleetSummary,
  type ManagedEndpointClassification,
} from "./classify";
import { networkInventoryResponseSchema, type RawRecord } from "./types";

const FOLDER_TYPE = 4;
// GravityZone's Active Directory integration auto-creates a "Deleted" system
// folder for AD objects that were removed — confirmed on a live tenant to be
// full of stale, unmanaged devices that no longer physically exist. Counting
// those as "at risk" would badly skew the dashboard, so this folder is skipped.
const EXCLUDED_FOLDER_NAMES = new Set(["deleted"]);
const PER_PAGE = 100;
const MAX_FOLDERS = 200; // safety cap against an unexpectedly deep/large tree
const MAX_ENDPOINTS = 2000;
const DETAIL_CONCURRENCY = 5; // stay well under the 10 req/s account-wide limit

async function listChildren(parentId: string | null): Promise<RawRecord[]> {
  const items: RawRecord[] = [];

  for (let page = 1; ; page++) {
    const raw = await callMethod<unknown>("network", "getNetworkInventoryItems", {
      parentId,
      page,
      perPage: PER_PAGE,
    });

    const parsed = networkInventoryResponseSchema.safeParse(raw);
    if (!parsed.success) {
      console.warn(
        "[gravityzone] Unexpected getNetworkInventoryItems shape:",
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

// The inventory has no documented bulk "endpoints only" filter, so this walks
// the folder tree breadth-first collecting every non-folder (leaf) item.
// Endpoints are deduped by id defensively — a live tenant showed 0 actual
// cross-branch duplicates, but GravityZone's inventory tree has no structural
// guarantee against it (e.g. "Custom Groups" can list items independently of
// the Active Directory sync branch), so this stays as a correctness backstop.
async function collectEndpoints(): Promise<RawRecord[]> {
  const endpoints: RawRecord[] = [];
  const seenIds = new Set<string>();
  const frontier: Array<string | null> = [null];
  let foldersVisited = 0;

  while (frontier.length > 0 && foldersVisited < MAX_FOLDERS && endpoints.length < MAX_ENDPOINTS) {
    const parentId = frontier.shift()!;
    foldersVisited++;
    const children = await listChildren(parentId);

    for (const child of children) {
      if (child.type === FOLDER_TYPE) {
        const name = typeof child.name === "string" ? child.name.trim().toLowerCase() : "";
        if (EXCLUDED_FOLDER_NAMES.has(name)) continue;
        frontier.push(String(child.id));
        continue;
      }

      const id = String(child.id);
      if (seenIds.has(id)) continue;
      seenIds.add(id);
      endpoints.push(child);
    }
  }

  return endpoints;
}

async function mapWithConcurrency<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;

  async function worker() {
    while (next < items.length) {
      const index = next++;
      results[index] = await fn(items[index]);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

async function fetchFleetSummary(): Promise<FleetSummary> {
  const endpoints = await collectEndpoints();

  const managedIds: string[] = [];
  const unmanagedItems: RawRecord[] = [];

  for (const endpoint of endpoints) {
    const details = endpoint.details;
    const isManaged = typeof details === "object" && details !== null && (details as RawRecord).isManaged === true;
    if (isManaged && typeof endpoint.id === "string") {
      managedIds.push(endpoint.id);
    } else {
      unmanagedItems.push(endpoint);
    }
  }

  const now = Date.now();
  const offlineThresholdMs = offlineThresholdMinutes * 60_000;

  const classifications = await mapWithConcurrency<string, ManagedEndpointClassification>(
    managedIds,
    DETAIL_CONCURRENCY,
    async (id) => {
      try {
        const detail = await callMethod<RawRecord>("network", "getManagedEndpointDetails", { endpointId: id });
        return classifyManagedEndpoint(detail, offlineThresholdMs, now);
      } catch {
        // A "managed" endpoint whose detail call still fails is not answering —
        // offline is the safe read; no score/policy/version data to report either.
        return { status: "offline", riskScore: null, policyApplied: true, agentVersion: null };
      }
    }
  );

  return summarizeFleet(classifications, unmanagedItems);
}

export const fleetCache = new SnapshotCache(cacheTtlSeconds * 1000, fetchFleetSummary);
