/**
 * GET  /api/standards — List standards (filter by framework/subject/grade/strand)
 * POST /api/standards — Create a standard (admin only)
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { can, PlatformPermission } from "@/features/rbac";
import { listStandards, createStandard } from "@/features/knowledge-intelligence";
import { z } from "zod";

const createSchema = z.object({
  frameworkId: z.string(),
  code: z.string().min(1).max(100),
  title: z.string().min(1).max(300),
  description: z.string().max(2000).optional(),
  subject: z.string().min(1).max(100),
  grade: z.string().min(1).max(20),
  strand: z.string().max(100).optional(),
  outcomes: z.array(z.string()).default([]),
  bloomLevel: z.enum(["remember", "understand", "apply", "analyze", "evaluate", "create"]).optional(),
});

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 },
    );
  }
  const url = new URL(req.url);
  const standards = await listStandards({
    frameworkId: url.searchParams.get("frameworkId") ?? undefined,
    subject: url.searchParams.get("subject") ?? undefined,
    grade: url.searchParams.get("grade") ?? undefined,
    strand: url.searchParams.get("strand") ?? undefined,
    limit: Number(url.searchParams.get("limit") ?? 200),
  });
  return NextResponse.json({ standards, total: standards.length });
});

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId || (!can(ctx, PlatformPermission.PLATFORM_ADMIN) && !ctx.isSuperadmin)) {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "Admin access required" } },
      { status: 403 },
    );
  }
  const body = createSchema.parse(await req.json());
  const standard = await createStandard(body);
  return NextResponse.json(standard, { status: 201 });
});
