/**
 * GET  /api/enterprise/tenants — List tenants
 * POST /api/enterprise/tenants — Create a tenant
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listTenants, createTenant } from "@/features/enterprise-integration";
import { z } from "zod";

const schema = z.object({
  type: z.enum(["district", "ministry", "university", "franchise", "regional_office", "subsidiary", "school"]),
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  parentId: z.string().optional(),
  organizationId: z.string().optional(),
  adminIds: z.array(z.string()).default([]),
  delegatedAdmin: z.boolean().default(false),
  limits: z.record(z.string(), z.unknown()).optional(),
  branding: z.record(z.string(), z.unknown()).optional(),
});

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const url = new URL(req.url);
  const tenants = await listTenants({
    type: url.searchParams.get("type") ?? undefined,
    parentId: url.searchParams.get("parentId") ?? undefined,
    organizationId: url.searchParams.get("organizationId") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
    limit: Number(url.searchParams.get("limit") ?? 100),
  });
  return NextResponse.json({ tenants, total: tenants.length });
});

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const body = schema.parse(await req.json());
  const tenant = await createTenant(body);
  return NextResponse.json(tenant, { status: 201 });
});
