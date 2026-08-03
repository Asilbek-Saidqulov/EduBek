/** GET+POST /api/intelligence-network/models — List/register foundation models */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listFoundationModels, registerFoundationModel, deployFoundationModel } from "@/features/global-intelligence";

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const url = new URL(req.url);
  const models = await listFoundationModels({
    domain: url.searchParams.get("domain") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
    limit: Number(url.searchParams.get("limit") ?? 50),
  });
  return NextResponse.json({ models, total: models.length });
});

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const url = new URL(req.url);
  if (url.searchParams.get("action") === "deploy") {
    const body = await req.json();
    const model = await deployFoundationModel(body.id, body.metrics);
    return NextResponse.json(model);
  }
  const body = await req.json();
  const model = await registerFoundationModel(body);
  return NextResponse.json(model, { status: 201 });
});
