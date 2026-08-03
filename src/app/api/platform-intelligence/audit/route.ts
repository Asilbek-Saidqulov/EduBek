/** GET /api/platform-intelligence/audit — Audit log (every autonomous action) */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listAuditLog } from "@/features/platform-intelligence";

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 },
    );
  }
  const url = new URL(req.url);
  const events = await listAuditLog({
    actionType: url.searchParams.get("actionType") as any ?? undefined,
    actorType: url.searchParams.get("actorType") ?? undefined,
    actorId: url.searchParams.get("actorId") ?? undefined,
    entityType: url.searchParams.get("entityType") ?? undefined,
    entityId: url.searchParams.get("entityId") ?? undefined,
    affectedUserId: url.searchParams.get("affectedUserId") ?? undefined,
    scopeType: url.searchParams.get("scopeType") ?? undefined,
    scopeId: url.searchParams.get("scopeId") ?? undefined,
    outcome: url.searchParams.get("outcome") ?? undefined,
    sinceDays: Number(url.searchParams.get("sinceDays") ?? 30),
    limit: Number(url.searchParams.get("limit") ?? 100),
  });
  return NextResponse.json({ events, total: events.length });
});
