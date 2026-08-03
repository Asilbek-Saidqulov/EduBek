/**
 * GET /api/cognitive/tools — List tools + select tools for an intent
 *
 * Query params:
 *   - module (optional — filter by module)
 *   - intent (optional — if provided, returns tool selection result)
 *   - query (optional — required if intent is provided)
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listTools, selectTools } from "@/features/cognitive-ai";

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  }
  const url = new URL(req.url);
  const moduleFilter = url.searchParams.get("module") ?? undefined;
  const intent = url.searchParams.get("intent");
  const query = url.searchParams.get("query");
  if (intent && query) {
    const selection = selectTools({
      intent,
      query,
      availablePermissions: ctx.personalPermissionOverrides
        .filter(p => p.granted).map(p => p.permission),
      goals: [],
    });
    return NextResponse.json(selection);
  }
  const tools = listTools(moduleFilter);
  return NextResponse.json({ tools, total: tools.length });
});
