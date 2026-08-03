/**
 * POST /api/platform-intelligence/optimize — Run the optimization engine
 *
 * Runs all optimization heuristics and returns the snapshots. Auto-applies
 * optimizations with confidence ≥ threshold.
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { can, PlatformPermission } from "@/features/rbac";
import { runOptimizationCycle } from "@/features/platform-intelligence";

export const POST = withErrorHandler(async () => {
  const ctx = await getAuthContext();
  if (!ctx.userId || (!can(ctx, PlatformPermission.PLATFORM_ADMIN) && !ctx.isSuperadmin)) {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "Admin access required" } },
      { status: 403 },
    );
  }
  const snapshots = await runOptimizationCycle();
  return NextResponse.json({ optimizations: snapshots, total: snapshots.length });
});
