/** GET /api/workflows/conditions — Condition engine info (read-only) */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";

export const GET = withErrorHandler(async () => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  }
  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    operators: ["equals", "contains", "greater", "less", "regex", "date", "time", "role", "permission", "organization", "subscription", "ai_provider", "feature_flag", "custom_var"],
    logicalOperators: ["AND", "OR", "NOT"],
    supportsNested: true,
    supportsCustomVariables: true,
  });
});
