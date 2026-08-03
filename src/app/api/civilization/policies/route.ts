/** GET+POST /api/civilization/policies — List/create educational policies */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listPolicies, createPolicy, approvePolicy } from "@/features/civilization-engine";

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const url = new URL(req.url);
  const policies = await listPolicies({ organizationId: url.searchParams.get("organizationId")!, type: url.searchParams.get("type") ?? undefined, status: url.searchParams.get("status") ?? undefined, limit: Number(url.searchParams.get("limit") ?? 100) });
  return NextResponse.json({ policies, total: policies.length });
});

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const url = new URL(req.url);
  if (url.searchParams.get("action") === "approve") {
    const body = await req.json();
    const policy = await approvePolicy(body.id, ctx.userId, body.comment);
    return NextResponse.json(policy);
  }
  const body = await req.json();
  const policy = await createPolicy({ ...body, ownerId: ctx.userId });
  return NextResponse.json(policy, { status: 201 });
});
