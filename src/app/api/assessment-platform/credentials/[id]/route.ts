/** GET /api/assessment-platform/credentials/:id — Get credential; POST :id?action=revoke — Revoke */
import { NextResponse } from "next/server";
import { withErrorHandler, notFound } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { getCredential, revokeCredential } from "@/features/assessment-platform";
import { z } from "zod";

const revokeSchema = z.object({ reason: z.string().min(1).max(500) });

export const GET = withErrorHandler<{ id: string }>(async (_req, ctx) => {
  const authCtx = await getAuthContext();
  if (!authCtx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const { id } = await ctx.params;
  const credential = await getCredential(id);
  if (!credential) throw notFound("Credential not found");
  return NextResponse.json(credential);
});

export const POST = withErrorHandler<{ id: string }>(async (req, ctx) => {
  const authCtx = await getAuthContext();
  if (!authCtx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const { id } = await ctx.params;
  const url = new URL(req.url);
  if (url.searchParams.get("action") === "revoke") {
    const body = revokeSchema.parse(await req.json());
    const credential = await revokeCredential(id, body.reason);
    return NextResponse.json(credential);
  }
  return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Unknown action" } }, { status: 400 });
});
