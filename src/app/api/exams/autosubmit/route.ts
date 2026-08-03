/**
 * POST /api/exams/autosubmit  — system endpoint: auto-submit all expired exams
 *
 * In production this is invoked by a cron job. For Phase 4B it is also
 * callable by an admin (with PersonalPermission.ASSESSMENT_MANAGE) to
 * trigger a manual sweep.
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { can, PersonalPermission } from "@/features/rbac";
import { forbidden, unauthorized } from "@/lib/errors";
import { autoSubmitExpiredExams } from "@/features/exam";

export const POST = withErrorHandler(async () => {
  const ctx = await getAuthContext();
  if (!ctx.userId) throw unauthorized("Authentication required");
  if (!can(ctx, PersonalPermission.ASSESSMENT_MANAGE) && !ctx.isSuperadmin) {
    throw forbidden("Only admins can trigger a manual exam auto-submit sweep");
  }
  const result = await autoSubmitExpiredExams();
  return NextResponse.json(result);
});
