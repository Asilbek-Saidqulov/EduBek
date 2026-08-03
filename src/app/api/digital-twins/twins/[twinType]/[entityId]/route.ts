/** GET /api/digital-twins/twins/:twinType/:entityId — Get or sync a digital twin */
import { NextResponse } from "next/server";
import { withErrorHandler, notFound } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { getTwin } from "@/features/digital-twins";
import { z } from "zod";

const schema = z.object({
  sync: z.enum(["true", "false"]).default("true").transform((v) => v === "true"),
});

export const GET = withErrorHandler<{ twinType: string; entityId: string }>(async (req, ctx) => {
  const authCtx = await getAuthContext();
  if (!authCtx.userId) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 },
    );
  }
  const { twinType, entityId } = await ctx.params;
  const validTypes = ["classroom", "student", "teacher", "institution"];
  if (!validTypes.includes(twinType)) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: `Invalid twinType. Must be one of: ${validTypes.join(", ")}` } },
      { status: 400 },
    );
  }
  const url = new URL(req.url);
  const params = Object.fromEntries(url.searchParams);
  const { sync } = schema.parse(params);
  const twin = await getTwin(twinType as any, entityId, sync);
  if (!twin) throw notFound("Twin not found");
  return NextResponse.json(twin);
});
