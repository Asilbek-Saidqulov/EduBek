/** GET/POST/PUT /api/trust/appeals — Appeal platform */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listAppeals, submitAppeal, assignAppeal, startAppealReview, decideAppeal, escalateAppeal, withdrawAppeal, supportsAllAppealStatuses } from "@/features/trust-platform";

export const GET = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") as any;
  return NextResponse.json({ appeals: listAppeals(status ?? undefined), statuses: supportsAllAppealStatuses() });
});

export const POST = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const body = await req.json();
  const appeal = submitAppeal({ ...body, appellantId: body.appellantId ?? ctx.userId });
  return NextResponse.json({ appeal }, { status: 201 });
});

export const PUT = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const body = await req.json();
  let appeal = null;
  if (body.action === "assign") appeal = assignAppeal(body.id, body.reviewerId, ctx.userId);
  else if (body.action === "review") appeal = startAppealReview(body.id, ctx.userId);
  else if (body.action === "decide") appeal = decideAppeal(body.id, body.decision, body.reason, ctx.userId);
  else if (body.action === "escalate") appeal = escalateAppeal(body.id, ctx.userId, body.reason);
  else if (body.action === "withdraw") appeal = withdrawAppeal(body.id, ctx.userId);
  return NextResponse.json({ appeal });
});
