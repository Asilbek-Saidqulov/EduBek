/** PATCH /api/interventions/:id — Update intervention status (resolve / dismiss) */
import { NextResponse } from "next/server";
import { withErrorHandler, notFound } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { db } from "@/lib/db";
import { resolveIntervention } from "@/features/collaboration";
import { z } from "zod";

const schema = z.object({
  status: z.enum(["pending", "active", "resolved", "dismissed"]).optional(),
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
  if (body.status === "resolved") {
    const updated = await resolveIntervention(id);
    return NextResponse.json(updated);
  }
  if (body.status) {
    const updated = await db.intervention.update({ where: { id }, data: { status: body.status } });
    return NextResponse.json(updated);
  }
  throw notFound("No update specified");
});
