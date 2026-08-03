/**
 * GET  /api/frameworks — List curriculum frameworks
 * POST /api/frameworks — Create a custom framework (org admin only)
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { can, PlatformPermission } from "@/features/rbac";
import { listFrameworks, createCustomFramework } from "@/features/knowledge-intelligence";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  region: z.string().max(100).optional(),
  language: z.string().min(2).max(5).default("en"),
  organizationId: z.string(),
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
  const frameworks = await listFrameworks(url.searchParams.get("organizationId") ?? undefined);
  return NextResponse.json({ frameworks, total: frameworks.length });
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
  const framework = await createCustomFramework(body);
  return NextResponse.json(framework, { status: 201 });
});
