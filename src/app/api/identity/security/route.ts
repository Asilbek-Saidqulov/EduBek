/** GET/POST /api/identity/security — Security policies */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listSecurityPolicies, createSecurityPolicy, deactivateSecurityPolicy, updateSecurityPolicy, validatePasswordAgainstPolicy, supportsAllRiskPolicies } from "@/features/identity-platform";

export const GET = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const { searchParams } = new URL(req.url);
  const active = searchParams.get("active");
  const orgId = searchParams.get("organizationId");
  return NextResponse.json({
    policies: listSecurityPolicies(active === null ? undefined : active === "true", orgId ?? null),
    riskPolicies: supportsAllRiskPolicies(),
  });
});

export const POST = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const body = await req.json();
  if (body.action === "deactivate") return NextResponse.json({ policy: deactivateSecurityPolicy(body.id) });
  if (body.action === "update") return NextResponse.json({ policy: updateSecurityPolicy(body.id, body.updates) });
  if (body.action === "validate_password") return NextResponse.json({ result: validatePasswordAgainstPolicy(body.password, body.policy) });
  const policy = createSecurityPolicy(body);
  return NextResponse.json({ policy }, { status: 201 });
});
