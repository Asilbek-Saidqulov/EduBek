/** PATCH /api/digital-twins/operations/:id — Acknowledge / resolve / dismiss an operation */
import { NextResponse } from "next/server";
import { withErrorHandler, notFound } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { acknowledgeOperation, resolveOperation, dismissOperation } from "@/features/digital-twins";
import { z } from "zod";

const schema = z.object({
  action: z.enum(["acknowledge", "resolve", "dismiss"]),
});

export const PATCH = withErrorHandler<{ id: string }>(async (req, ctx) => {
  const authCtx = await getAuthContext();
  if (!authCtx.userId) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 },
    );
  }
  const { id } = await ctx.params;
  const body = schema.parse(await req.json());
  switch (body.action) {
    case "acknowledge": await acknowledgeOperation(id); break;
    case "resolve": await resolveOperation(id); break;
    case "dismiss": await dismissOperation(id); break;
  }
  return NextResponse.json({ success: true, action: body.action });
});
