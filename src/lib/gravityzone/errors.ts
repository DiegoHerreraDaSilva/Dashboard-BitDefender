export class GravityZoneError extends Error {}

export class GravityZoneHttpError extends GravityZoneError {
  constructor(
    public readonly status: number,
    statusText: string,
    body: string
  ) {
    super(`GravityZone HTTP ${status} ${statusText}: ${body.slice(0, 500)}`);
  }
}

export class GravityZoneRpcError extends GravityZoneError {
  constructor(
    public readonly code: number,
    message: string,
    public readonly data?: unknown
  ) {
    super(`GravityZone RPC error ${code}: ${message}`);
  }
}

export class GravityZoneTimeoutError extends GravityZoneError {
  constructor(method: string, timeoutMs: number) {
    super(`GravityZone call "${method}" timed out after ${timeoutMs}ms`);
  }
}

export class GravityZoneRateLimitError extends GravityZoneError {
  constructor(method: string, attempts: number) {
    super(`GravityZone call "${method}" rate-limited after ${attempts} attempt(s)`);
  }
}
