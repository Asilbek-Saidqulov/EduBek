/**
 * GET  /api/platform/installs — List installs
 * POST /api/platform/installs — Install an extension
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listInstalls, installExtension } from "@/features/platform-sdk";
import { z } from "zod";
import { resolveTargetUserId } from "@/lib/auth/resolve-target-user";

const schema = z.object({
  extensionId: z.string().min(1), version: z.string().default("1.0.0"),
  organizationId: z.string().optional(), userId: z.string().optional(),
  config: z.record(z.string(), z.unknown()).optional(),
  approvedPermissions: z.array(z.string()).optional(),
  cpuLimit: z.number().int().min(10).max(100).optional(),
  memoryLimitMb: z.number().int().min(32).max(1024).optional(),
  timeoutMs: z.number().int().min(1000).max(300000).optional(),
  networkEnabled: z.boolean().optional(),
});

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const url = new URL(req.url);
  const installs = await listInstalls({
    extensionId: url.searchParams.get("extensionId") ?? undefined,
    organizationId: url.searchParams.get("organizationId") ?? undefined,
    userId: url.resolveTargetUserId(ctx, searchParams.get("userId")),
    status: url.searchParams.get("status") ?? undefined,
    limit: Number(url.searchParams.get("limit") ?? 100),
  });
  return NextResponse.json({ installs, total: installs.length });
});

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const body = schema.parse(await req.json());
  const install = await installExtension({ ...body, installedBy: ctx.userId });
  return NextResponse.json(install, { status: 201 });
});
