/** GET/POST /api/trust/policies — Safety policy registry */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listPolicies, createPolicy, publishPolicyVersion, deactivatePolicy, addPolicyRule, supportsAllPolicyCategories, supportsAllPolicySeverities } from "@/features/trust-platform";

export const GET = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") as any;
  const active = searchParams.get("active");
  return NextResponse.json({
    policies: listPolicies(category ?? undefined, active === null ? undefined : active === "true"),
    categories: supportsAllPolicyCategories(), severities: supportsAllPolicySeverities(),
  });
});

export const POST = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const body = await req.json();
  if (body.action === "publish_version") return NextResponse.json({ policy: publishPolicyVersion(body.id, body.version, body.content, ctx.userId) });
  if (body.action === "deactivate") return NextResponse.json({ policy: deactivatePolicy(body.id) });
  if (body.action === "add_rule") return NextResponse.json({ policy: addPolicyRule(body.id, body.rule) });
  const policy = createPolicy(body);
  return NextResponse.json({ policy }, { status: 201 });
});
