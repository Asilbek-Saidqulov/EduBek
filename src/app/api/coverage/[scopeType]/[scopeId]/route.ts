/**
 * GET /api/coverage/:scopeType/:scopeId — Get coverage for a scope
 *   Query: ?frameworkId=...&refresh=true
 */
import { NextResponse } from "next/server";
import { withErrorHandler, notFound } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { getCoverage } from "@/features/knowledge-intelligence";
import { z } from "zod";

const schema = z.object({
  frameworkId: z.string().min(1),
  refresh: z.enum(["true", "false"]).default("false").transform((v) => v === "true"),
});

export const GET = withErrorHandler<{ scopeType: string; scopeId: string }>(async (req, ctx) => {
  const authCtx = await getAuthContext();
  if (!authCtx.userId) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 },
    );
  }
  const { scopeType, scopeId } = await ctx.params;
  const url = new URL(req.url);
  const params = Object.fromEntries(url.searchParams);
  const parsed = schema.parse(params);

  const validScopeTypes = ["classroom", "organization", "framework"];
  if (!validScopeTypes.includes(scopeType)) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: `Invalid scopeType. Must be one of: ${validScopeTypes.join(", ")}` } },
      { status: 400 },
    );
  }

  const coverage = await getCoverage({
    scopeType: scopeType as "classroom" | "organization" | "framework",
    scopeId,
    frameworkId: parsed.frameworkId,
    refresh: parsed.refresh,
  });
  if (!coverage) throw notFound("Coverage not available");
  return NextResponse.json(coverage);
});
