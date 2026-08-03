/**
 * GET  /api/discovery/clusters — List semantic clusters
 * POST /api/discovery/clusters — Compute clusters for a given entity type (admin)
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { can, PlatformPermission } from "@/features/rbac";
import { computeClusters } from "@/features/semantic-search";
import { db } from "@/lib/db";
import { z } from "zod";

export const GET = withErrorHandler(async (req) => {
  const url = new URL(req.url);
  const topicId = url.searchParams.get("topicId") ?? undefined;
  const clusters = await db.semanticCluster.findMany({
    where: topicId ? { topicId } : undefined,
    take: 100,
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json({
    clusters: clusters.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      topicId: c.topicId,
      memberCount: JSON.parse(c.members || "[]").length,
      updatedAt: c.updatedAt.toISOString(),
    })),
  });
});

const postSchema = z.object({
  entityType: z.string().min(1),
  k: z.number().int().min(2).max(20).default(5),
});

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId || (!can(ctx, PlatformPermission.PLATFORM_ADMIN) && !ctx.isSuperadmin)) {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "Admin access required" } },
      { status: 403 },
    );
  }

  const body = postSchema.parse(await req.json());
  const k = await computeClusters(body.entityType, body.k);
  return NextResponse.json({ success: true, clustersComputed: k });
});
