/** GET/POST /api/telemetry/dependencies — Dependency graph */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listDependencies, registerDependency, getDependencyGraph, supportsAllDependencyTypes, supportsAllDependencyStatuses } from "@/features/telemetry-platform";

export const GET = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from") ?? undefined;
  const to = searchParams.get("to") ?? undefined;
  return NextResponse.json({
    dependencies: listDependencies(from, to), graph: getDependencyGraph(),
    types: supportsAllDependencyTypes(), statuses: supportsAllDependencyStatuses(),
  });
});

export const POST = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const body = await req.json();
  const dep = registerDependency(body);
  return NextResponse.json({ dependency: dep }, { status: 201 });
});
