/** GET /api/platform/extensions/:id — Get extension; POST :id?action=approve|reject */
import { NextResponse } from "next/server";
import { withErrorHandler, notFound } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { can, PlatformPermission } from "@/features/rbac";
import { getExtension, approveExtension, rejectExtension } from "@/features/platform-sdk";

export const GET = withErrorHandler<{ id: string }>(async (_req, ctx) => {
  const authCtx = await getAuthContext();
  if (!authCtx.userId) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  const { id } = await ctx.params;
  const ext = await getExtension(id);
  if (!ext) throw notFound("Extension not found");
  return NextResponse.json(ext);
});

export const POST = withErrorHandler<{ id: string }>(async (req, ctx) => {
  const authCtx = await getAuthContext();
  if (!authCtx.userId || (!can(authCtx, PlatformPermission.PLATFORM_ADMIN) && !authCtx.isSuperadmin))
    return NextResponse.json({ error: { code: "FORBIDDEN", message: "Admin access required" } }, { status: 403 });
  const { id } = await ctx.params;
  const url = new URL(req.url);
  const action = url.searchParams.get("action");
  if (action === "approve") return NextResponse.json(await approveExtension(id));
  if (action === "reject") return NextResponse.json(await rejectExtension(id));
  return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Unknown action" } }, { status: 400 });
});
