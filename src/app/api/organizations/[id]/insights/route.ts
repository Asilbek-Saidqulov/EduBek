/** GET /api/organizations/:id/insights — Get or compute organization insights */
import { NextResponse } from "next/server";
import { withErrorHandler, notFound } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { computeOrganizationInsight, getOrganizationInsight } from "@/features/collaboration";
import { z } from "zod";

const schema = z.object({
  refresh: z.enum(["true", "false"]).default("false").transform((v) => v === "true"),
});

export const GET = withErrorHandler<{ id: string }>(async (req, ctx) => {
  const authCtx = await getAuthContext();
  if (!authCtx.userId) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 },
    );
  }
  const { id } = await ctx.params;
  const url = new URL(req.url);
  const params = Object.fromEntries(url.searchParams);
  const parsed = schema.parse(params);

  const insight = parsed.refresh
    ? await computeOrganizationInsight(id).catch(() => null)
    : await getOrganizationInsight(id);
  if (!insight) throw notFound("Organization insights not available");
  return NextResponse.json(insight);
});
