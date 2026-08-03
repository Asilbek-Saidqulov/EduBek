/** GET+POST /api/research/patents — List/create patent workspaces */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listPatents, createPatentWorkspace, updatePatentStatus } from "@/features/research-platform";

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const url = new URL(req.url);
  const patents = await listPatents({
    organizationId: url.searchParams.get("organizationId") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
    limit: Number(url.searchParams.get("limit") ?? 50),
  });
  return NextResponse.json({ patents, total: patents.length });
});

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const url = new URL(req.url);
  if (url.searchParams.get("action") === "update_status") {
    const body = await req.json();
    const patent = await updatePatentStatus(body.id, body.status, body.patentNumber);
    return NextResponse.json(patent);
  }
  const body = await req.json();
  const patent = await createPatentWorkspace(body);
  return NextResponse.json(patent, { status: 201 });
});
