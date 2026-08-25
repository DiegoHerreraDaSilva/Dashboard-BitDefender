import { z } from "zod";

// Kept permissive (optional fields, .passthrough()) so unexpected/extra keys
// never throw — field names below are confirmed against either a live tenant
// or Bitdefender's official reference docs (see comments in classify.ts),
// but GravityZone can still add fields over time.

export const rawRecordSchema = z.record(z.string(), z.unknown());
export type RawRecord = z.infer<typeof rawRecordSchema>;

export const networkInventoryResponseSchema = z
  .object({
    items: z.array(rawRecordSchema).optional(),
    total: z.number().optional(),
    page: z.number().optional(),
    perPage: z.number().optional(),
    pagesCount: z.number().optional(),
  })
  .passthrough();

// getIncidentsList (v1.2) confirmed response envelope.
export const incidentsListResponseSchema = z
  .object({
    items: z.array(rawRecordSchema).optional(),
    total: z.number().optional(),
  })
  .passthrough();

// getLicenseInfo's result is an array of per-product license entries — see
// licensing.ts, which validates that shape directly rather than via zod.
