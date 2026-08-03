/**
 * GET  /api/similarity — List similarity clusters
 * POST /api/similarity/find — Find similar entities for a given entity
 * POST /api/similarity/scan — Scan for duplicates (admin only)
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { can, PlatformPermission } from "@/features/rbac";
import { listSimilarityClusters, findSimilarEntities, scanForDuplicates } from "@/features/knowledge-intelligence";
import { z } from "zod";

const findSchema = z.object({
  entityType: z.string().min(1),
  entityId: z.string().min(1),
  title: z.string().min(1).max(300),
  content: z.string(),
  threshold: z.number().min(0).max(1).default(0.6),
  limit: z.number().int().min(1).max(50).default(10),
});

const scanSchema = z.object({
  entityType: z.string().min(1),
  limit: z.number().int().min(1).max(500).default(100),
  threshold: z.number().min(0).max(1).default(0.8),
});

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 },
    );
  }
  const url = new URL(req.url);
  const clusters = await listSimilarityClusters({
    entityType: url.searchParams.get("entityType") ?? undefined,
    clusterType: url.searchParams.get("clusterType") ?? undefined,
    limit: Number(url.searchParams.get("limit") ?? 50),
  });
  return NextResponse.json({ clusters, total: clusters.length });
});

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 },
    );
  }
  const url = new URL(req.url);
  const action = url.searchParams.get("action") ?? "find";
  const body = await req.json();

  if (action === "scan") {
    // Admin only
    if (!can(ctx, PlatformPermission.PLATFORM_ADMIN) && !ctx.isSuperadmin) {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "Admin access required" } },
        { status: 403 },
      );
    }
    const parsed = scanSchema.parse(body);
    const result = await scanForDuplicates(parsed);
    return NextResponse.json(result);
  }

  // Default: find similar
  const parsed = findSchema.parse(body);
  const similar = await findSimilarEntities(parsed);
  return NextResponse.json({ similar, total: similar.length });
});
