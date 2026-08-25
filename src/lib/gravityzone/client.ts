import { randomUUID } from "node:crypto";
import { getGravityZoneCredentials, maxRetries429, requestTimeoutMs } from "@/lib/config";
import {
  GravityZoneHttpError,
  GravityZoneRateLimitError,
  GravityZoneRpcError,
  GravityZoneTimeoutError,
} from "./errors";

export type ApiNamespace = "network" | "incidents" | "licensing" | "companies";
export type ApiVersion = "v1.0" | "v1.1" | "v1.2";

interface CallOptions {
  version?: ApiVersion;
}

interface JsonRpcSuccess<T> {
  jsonrpc: "2.0";
  id: string;
  result: T;
}

interface JsonRpcFailure {
  jsonrpc: "2.0";
  id: string;
  error: { code: number; message: string; data?: unknown };
}

type JsonRpcResponse<T> = JsonRpcSuccess<T> | JsonRpcFailure;

function authHeader(apiKey: string): string {
  return "Basic " + Buffer.from(`${apiKey}:`).toString("base64");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function callMethod<T>(
  api: ApiNamespace,
  method: string,
  params: Record<string, unknown> = {},
  opts: CallOptions = {}
): Promise<T> {
  const { accessUrl, apiKey } = getGravityZoneCredentials();
  const version = opts.version ?? "v1.0";
  const url = `${accessUrl}/${version}/jsonrpc/${api}`;

  for (let attempt = 0; ; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);

    let response: Response;
    try {
      response = await fetch(url, {
        method: "POST",
        cache: "no-store",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader(apiKey),
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: randomUUID(),
          method,
          params,
        }),
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new GravityZoneTimeoutError(method, requestTimeoutMs);
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }

    if (response.status === 429) {
      if (attempt >= maxRetries429) {
        throw new GravityZoneRateLimitError(method, attempt + 1);
      }
      const retryAfter = Number.parseFloat(response.headers.get("retry-after") ?? "");
      const backoffMs =
        Number.isFinite(retryAfter) && retryAfter > 0
          ? retryAfter * 1000
          : 500 * 2 ** attempt + Math.random() * 250;
      await sleep(backoffMs);
      continue;
    }

    const bodyText = await response.text();

    if (!response.ok) {
      throw new GravityZoneHttpError(response.status, response.statusText, bodyText);
    }

    const parsed = JSON.parse(bodyText) as JsonRpcResponse<T>;
    if ("error" in parsed) {
      throw new GravityZoneRpcError(parsed.error.code, parsed.error.message, parsed.error.data);
    }
    return parsed.result;
  }
}
