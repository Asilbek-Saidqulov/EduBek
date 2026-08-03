/** GET+POST /api/cloud/resources — List/allocate resources */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listAllocations, allocateResource } from "@/features/cloud-infra";
import { z } from "zod";

const schema = z.object({
  resourceType: z.string().min(1), allocatedTo: z.string().min(1),
  allocatedToType: z.enum(["worker", "job", "organization"]),
  amount: z.number().min(0), unit: z.string().default("cores"),
  organizationId: z.string().optional(),
});

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const url = new URL(req.url);
  const allocations = await listAllocations({
    resourceType: url.searchParams.get("resourceType") ?? undefined,
    allocatedTo: url.searchParams.get("allocatedTo") ?? undefined,
    status: url.searchParams.get("status") ?? "active",
    organizationId: url.searchParams.get("organizationId") ?? undefined,
    limit: Number(url.searchParams.get("limit") ?? 100),
  });
  return NextResponse.json({ allocations, total: allocations.length });
});

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const body = schema.parse(await req.json());
  const allocation = await allocateResource(body);
  return NextResponse.json(allocation, { status: 201 });
});
