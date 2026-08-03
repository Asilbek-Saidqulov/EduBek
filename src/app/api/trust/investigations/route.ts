/** GET/POST/PUT /api/trust/investigations — Investigation platform */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listInvestigations, openInvestigation, transitionInvestigation, assignInvestigation, resolveInvestigation, supportsAllInvestigationStatuses, supportsAllInvestigationPriorities } from "@/features/trust-platform";

export const GET = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") as any;
  const priority = searchParams.get("priority") as any;
  return NextResponse.json({
    investigations: listInvestigations(status ?? undefined, priority ?? undefined),
    statuses: supportsAllInvestigationStatuses(), priorities: supportsAllInvestigationPriorities(),
  });
});

export const POST = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const body = await req.json();
  const inv = openInvestigation(body);
  return NextResponse.json({ investigation: inv }, { status: 201 });
});

export const PUT = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const body = await req.json();
  let inv = null;
  if (body.action === "assign") inv = assignInvestigation(body.id, body.moderatorId, ctx.userId);
  else if (body.action === "resolve") inv = resolveInvestigation(body.id, body.outcome, body.resolution, ctx.userId);
  else inv = transitionInvestigation(body.id, body.to, ctx.userId, body.description);
  return NextResponse.json({ investigation: inv });
});
