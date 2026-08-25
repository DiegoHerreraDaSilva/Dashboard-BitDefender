import { NextResponse, type NextRequest } from "next/server";
import { enableDebugRoute } from "@/lib/config";
import { callMethod, type ApiNamespace, type ApiVersion } from "@/lib/gravityzone/client";

export const dynamic = "force-dynamic";

const ALLOWED_APIS: readonly ApiNamespace[] = ["network", "incidents", "licensing", "companies"];

function isAllowedApi(value: string): value is ApiNamespace {
  return (ALLOWED_APIS as readonly string[]).includes(value);
}

// Dev-only escape hatch to confirm real GravityZone response shapes against a
// live tenant, e.g.:
//   /api/debug/network?method=getNetworkInventoryItems&params={"page":1,"perPage":5}
//   /api/debug/incidents?method=getIncidentsList&version=v1.1&params={"page":1,"perPage":5}
// Gated behind ENABLE_DEBUG_ROUTE — must stay unset/false in production.
export async function GET(request: NextRequest, ctx: RouteContext<"/api/debug/[api]">) {
  if (!enableDebugRoute) {
    return NextResponse.json(
      { error: "Debug route disabled. Set ENABLE_DEBUG_ROUTE=true to enable it." },
      { status: 404 }
    );
  }

  const { api } = await ctx.params;
  if (!isAllowedApi(api)) {
    return NextResponse.json(
      { error: `Unknown API "${api}". Use one of: ${ALLOWED_APIS.join(", ")}` },
      { status: 400 }
    );
  }

  const method = request.nextUrl.searchParams.get("method");
  if (!method) {
    return NextResponse.json({ error: "Missing required query param: method" }, { status: 400 });
  }

  const versionParam = request.nextUrl.searchParams.get("version");
  const version: ApiVersion = versionParam === "v1.1" || versionParam === "v1.2" ? versionParam : "v1.0";

  const paramsRaw = request.nextUrl.searchParams.get("params");
  let rpcParams: Record<string, unknown> = {};
  if (paramsRaw) {
    try {
      rpcParams = JSON.parse(paramsRaw);
    } catch {
      return NextResponse.json({ error: "Query param 'params' must be valid JSON" }, { status: 400 });
    }
  }

  try {
    const result = await callMethod(api, method, rpcParams, { version });
    return NextResponse.json({ result });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 502 });
  }
}
