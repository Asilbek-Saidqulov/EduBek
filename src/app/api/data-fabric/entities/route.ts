/**
 * GET  /api/data-fabric/entities — List fabric entities
 * POST /api/data-fabric/entities — Register an entity in the fabric
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listEntities, registerEntity } from "@/features/data-fabric";
import { z } from "zod";

const schema = z.object({
  entityType: z.string().min(1), entityId: z.string().min(1),
  organizationId: z.string().optional(), state: z.record(z.string(), z.unknown()).optional(),
});

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const url = new URL(req.url);
  const entities = await listEntities({
    entityType: url.searchParams.get("entityType") ?? undefined,
    organizationId: url.searchParams.get("organizationId") ?? undefined,
    syncStatus: url.searchParams.get("syncStatus") ?? undefined,
    lifecycle: url.searchParams.get("lifecycle") ?? "active",
    limit: Number(url.searchParams.get("limit") ?? 100),
  });
  return NextResponse.json({ entities, total: entities.length });
});

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const body = schema.parse(await req.json());
  const entity = await registerEntity(body);
  return NextResponse.json(entity, { status: 201 });
});
