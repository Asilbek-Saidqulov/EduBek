/**
 * GET /api/orchestrator/dependencies — Universal dependency graph + impact analysis.
 *
 * Query params:
 *   - rebuild (boolean — force rebuild)
 *   - impact (string — node id for impact analysis)
 *   - kind (string — filter by node kind)
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import {
  getDependencyGraph, rebuildDependencyGraph, analyzeImpact,
  listNodesByKind, getGraphStats,
} from "@/features/platform-orchestrator";

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  }
  const url = new URL(req.url);
  const rebuild = url.searchParams.get("rebuild") === "true";
  const impactNodeId = url.searchParams.get("impact");
  const kind = url.searchParams.get("kind") ?? undefined;

  if (impactNodeId) {
    const analysis = analyzeImpact(impactNodeId);
    if (!analysis) {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "Node not found" } }, { status: 404 });
    }
    return NextResponse.json(analysis);
  }

  if (kind) {
    const nodes = listNodesByKind(kind as Parameters<typeof listNodesByKind>[0]);
    return NextResponse.json({ nodes, kind });
  }

  const graph = rebuild ? rebuildDependencyGraph() : getDependencyGraph();
  const stats = getGraphStats();
  return NextResponse.json({ ...graph, stats });
});
