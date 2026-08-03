/**
 * GET  /api/data-fabric/governance — List governance policies
 * POST /api/data-fabric/governance — Create a policy
 * POST /api/data-fabric/governance?action=enforce — Enforce retention policies
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { can, PlatformPermission } from "@/features/rbac";
import { listGovernancePolicies, createGovernancePolicy, enforceRetentionPolicies } from "@/features/data-fabric";
import { z } from "zod";

const schema = z.object({
  type: z.enum(["retention", "lineage", "audit", "schema_evolution", "data_quality", "consent", "compliance"]),
  name: z.string().min(1).max(200), description: z.string().max(2000).optional(),
  organizationId: z.string().optional(),
  rules: z.array(z.object({ field: z.string(), operator: z.string(), value: z.unknown(), action: z.string() })).optional(),
  retentionDays: z.number().int().min(1).max(3650).optional(),
  region: z.enum(["eu", "us", "global", "custom"]).default("global"),
});

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const url = new URL(req.url);
  const policies = await listGovernancePolicies({
    type: url.searchParams.get("type") ?? undefined,
    organizationId: url.searchParams.get("organizationId") ?? undefined,
    enabled: url.searchParams.get("enabled") === "true" ? true : undefined,
    limit: Number(url.searchParams.get("limit") ?? 100),
  });
  return NextResponse.json({ policies, total: policies.length });
});

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId || (!can(ctx, PlatformPermission.PLATFORM_ADMIN) && !ctx.isSuperadmin))
    return NextResponse.json({ error: { code: "FORBIDDEN", message: "Admin access required" } }, { status: 403 });
  const url = new URL(req.url);
  if (url.searchParams.get("action") === "enforce") {
    const result = await enforceRetentionPolicies();
    return NextResponse.json(result);
  }
  const body = schema.parse(await req.json());
  const policy = await createGovernancePolicy(body);
  return NextResponse.json(policy, { status: 201 });
});
