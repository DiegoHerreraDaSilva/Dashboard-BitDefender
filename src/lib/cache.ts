export type SnapshotState<T> =
  | { status: "ok"; data: T; fetchedAt: Date }
  | { status: "stale"; data: T; fetchedAt: Date; error: string }
  | { status: "error"; error: string };

/**
 * Per-domain snapshot cache. Only works correctly with a single long-running
 * Node process (no cluster/multi-worker `next start`) — each worker would
 * otherwise get its own cache and multiply calls to the GravityZone API.
 */
export class SnapshotCache<T> {
  private entry: { data: T; fetchedAt: number } | null = null;
  private inFlight: Promise<T> | null = null;

  constructor(
    private readonly ttlMs: number,
    private readonly fetcher: () => Promise<T>
  ) {}

  async get(): Promise<SnapshotState<T>> {
    const isFresh = this.entry !== null && Date.now() - this.entry.fetchedAt < this.ttlMs;
    if (isFresh) {
      return { status: "ok", data: this.entry!.data, fetchedAt: new Date(this.entry!.fetchedAt) };
    }

    if (!this.inFlight) {
      this.inFlight = this.fetcher().finally(() => {
        this.inFlight = null;
      });
    }

    try {
      const data = await this.inFlight;
      const fetchedAt = Date.now();
      this.entry = { data, fetchedAt };
      return { status: "ok", data, fetchedAt: new Date(fetchedAt) };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (this.entry) {
        return { status: "stale", data: this.entry.data, fetchedAt: new Date(this.entry.fetchedAt), error: message };
      }
      return { status: "error", error: message };
    }
  }
}
