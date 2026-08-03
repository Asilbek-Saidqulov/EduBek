/** GET/POST /api/notifications/routing — Notification routing rules */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listRoutingRules, createRoutingRule, routeEvent, supportsAllRoutingOperators } from "@/features/notifications-platform";

export const GET = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const { searchParams } = new URL(req.url);
  const active = searchParams.get("active");
  return NextResponse.json({
    rules: listRoutingRules(active === null ? undefined : active === "true"),
    operators: supportsAllRoutingOperators(),
  });
});

export const POST = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const body = await req.json();
  if (body.action === "route") {
    return NextResponse.json({ result: routeEvent(body.sourceEvent, body.payload ?? {}) });
  }
  const rule = createRoutingRule(body);
  return NextResponse.json({ rule }, { status: 201 });
});
