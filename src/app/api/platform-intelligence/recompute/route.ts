/**
 * POST /api/platform-intelligence/recompute — Recompute all aggregates
 *
 * Runs: insights generation + optimization cycle. Used by cron jobs
 * or admin "recompute now" button.
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { can, PlatformPermission } from "@/features/rbac";
import { recompute } from "@/features/platform-intelligence";

export const POST = withErrorHandler(async () => {
  const ctx = await getAuthContext();
  if (!ctx.userId || (!can(ctx, PlatformPermission.PLATFORM_ADMIN) && !ctx.isSuperadmin)) {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "Admin access required" } },
      { status: 403 },
    );
  }
  const result = await recompute();
  return NextResponse.json(result);
});
