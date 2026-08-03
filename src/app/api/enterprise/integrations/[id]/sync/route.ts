/** POST /api/enterprise/integrations/:id/sync — Run a sync */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { runSync } from "@/features/enterprise-integration";
import { z } from "zod";

const schema = z.object({ syncType: z.enum(["full", "incremental"]).default("incremental") });

export const POST = withErrorHandler<{ id: string }>(async (req, ctx) => {
  const authCtx = await getAuthContext();
  if (!authCtx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const { id } = await ctx.params;
  const body = schema.parse(await req.json());
  const result = await runSync({ integrationId: id, syncType: body.syncType });
  return NextResponse.json(result, { status: 201 });
});
