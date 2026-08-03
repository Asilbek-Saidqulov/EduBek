/**
 * GET  /api/assessment-platform/competencies/:id — Get competency + user evidence
 * POST /api/assessment-platform/competencies/:id — Record evidence / verify evidence
 */
import { NextResponse } from "next/server";
import { withErrorHandler, notFound } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { getCompetency, recordCompetencyEvidence, verifyCompetencyEvidence, getUserCompetencies } from "@/features/assessment-platform";
import { z } from "zod";

const postSchema = z.object({
  action: z.enum(["record_evidence", "verify_evidence", "get_user_competencies"]),
  userId: z.string().min(1),
  evidenceType: z.string().optional(),
  entityId: z.string().optional(),
  masteryLevel: z.number().min(0).max(1).optional(),
  evidenceId: z.string().optional(),
  approved: z.boolean().optional(),
});

export const GET = withErrorHandler<{ id: string }>(async (req, ctx) => {
  const authCtx = await getAuthContext();
  if (!authCtx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const { id } = await ctx.params;
  const url = new URL(req.url);
  if (url.searchParams.get("userCompetencies") === "true") {
    const userComps = await getUserCompetencies(id);
    return NextResponse.json({ competencies: userComps, total: userComps.length });
  }
  const competency = await getCompetency(id);
  if (!competency) throw notFound("Competency not found");
  return NextResponse.json(competency);
});

export const POST = withErrorHandler<{ id: string }>(async (req, ctx) => {
  const authCtx = await getAuthContext();
  if (!authCtx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const { id } = await ctx.params;
  const body = postSchema.parse(await req.json());

  if (body.action === "record_evidence") {
    const evidence = await recordCompetencyEvidence({
      competencyId: id, userId: body.userId, evidenceType: body.evidenceType ?? "assessment",
      entityId: body.entityId, masteryLevel: body.masteryLevel,
    });
    return NextResponse.json(evidence, { status: 201 });
  }
  if (body.action === "verify_evidence" && body.evidenceId) {
    await verifyCompetencyEvidence(body.evidenceId, authCtx.userId, body.approved ?? true);
    return NextResponse.json({ success: true });
  }
  if (body.action === "get_user_competencies") {
    const userComps = await getUserCompetencies(body.userId);
    return NextResponse.json({ competencies: userComps });
  }
  return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Unknown action" } }, { status: 400 });
});
