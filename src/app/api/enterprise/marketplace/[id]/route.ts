/** POST /api/enterprise/marketplace/:id — Approve an app (admin) */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { can, PlatformPermission } from "@/features/rbac";
import { approveMarketplaceApp } from "@/features/enterprise-integration";

export const POST = withErrorHandler<{ id: string }>(async (_req, ctx) => {
  const authCtx = await getAuthContext();
  if (!authCtx.userId || (!can(authCtx, PlatformPermission.PLATFORM_ADMIN) && !authCtx.isSuperadmin))
    return NextResponse.json({ error: { code: "FORBIDDEN", message: "Admin access required" } }, { status: 403 });
  const { id } = await ctx.params;
  const app = await approveMarketplaceApp(id);
  return NextResponse.json(app);
});
