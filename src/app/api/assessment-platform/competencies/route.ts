/**
 * GET  /api/assessment-platform/competencies — List competencies
 * POST /api/assessment-platform/competencies — Create a competency
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { can, PlatformPermission } from "@/features/rbac";
import { listCompetencies, createCompetency } from "@/features/assessment-platform";
import { z } from "zod";

const schema = z.object({
  code: z.string().min(1).max(100),
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  subject: z.string().max(100).optional(),
  level: z.enum(["foundational", "intermediate", "advanced", "expert"]).default("intermediate"),
  conceptIds: z.array(z.string()).optional(),
  prerequisiteIds: z.array(z.string()).optional(),
});

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const url = new URL(req.url);
  const competencies = await listCompetencies({
    subject: url.searchParams.get("subject") ?? undefined,
    level: url.searchParams.get("level") ?? undefined,
    limit: Number(url.searchParams.get("limit") ?? 100),
  });
  return NextResponse.json({ competencies, total: competencies.length });
});

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId || (!can(ctx, PlatformPermission.PLATFORM_ADMIN) && !ctx.isSuperadmin))
    return NextResponse.json({ error: { code: "FORBIDDEN", message: "Admin access required" } }, { status: 403 });
  const body = schema.parse(await req.json());
  const competency = await createCompetency(body);
  return NextResponse.json(competency, { status: 201 });
});
