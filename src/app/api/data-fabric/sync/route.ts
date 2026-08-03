/** POST /api/data-fabric/sync — Trigger distributed sync from a node */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { syncFromNode, getSyncCheckpoints } from "@/features/data-fabric";
import { z } from "zod";

const schema = z.object({
  nodeId: z.string().min(1), entityType: z.string().min(1),
  syncMode: z.enum(["full", "delta", "offline_recovery"]).default("delta"),
});

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const body = schema.parse(await req.json());
  const result = await syncFromNode(body);
  return NextResponse.json(result, { status: 201 });
});

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const url = new URL(req.url);
  const checkpoints = await getSyncCheckpoints({
    nodeId: url.searchParams.get("nodeId") ?? undefined,
    entityType: url.searchParams.get("entityType") ?? undefined,
    limit: Number(url.searchParams.get("limit") ?? 50),
  });
  return NextResponse.json({ checkpoints, total: checkpoints.length });
});
