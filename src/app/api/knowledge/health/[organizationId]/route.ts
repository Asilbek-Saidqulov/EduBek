/** GET /api/knowledge/health/:organizationId — Get org knowledge health snapshot */
import { NextResponse } from "next/server";
import { withErrorHandler, notFound } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { getKnowledgeHealth } from "@/features/knowledge-intelligence";
import { z } from "zod";

const schema = z.object({
  refresh: z.enum(["true", "false"]).default("false").transform((v) => v === "true"),
});

export const GET = withErrorHandler<{ organizationId: string }>(async (req, ctx) => {
  const authCtx = await getAuthContext();
  if (!authCtx.userId) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 },
    );
  }
  const { organizationId } = await ctx.params;
  const url = new URL(req.url);
  const params = Object.fromEntries(url.searchParams);
  const parsed = schema.parse(params);

  const health = await getKnowledgeHealth(organizationId, parsed.refresh);
  if (!health) throw notFound("Knowledge health not available");
  return NextResponse.json(health);
});
