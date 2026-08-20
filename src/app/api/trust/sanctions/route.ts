/** GET/POST/PUT /api/trust/sanctions — Sanction platform
 *
 * SECURITY:
 *   - All endpoints require authentication.
 *   - POST (create sanction) and PUT (approve/revoke) require moderator or
 *     admin role (PlatformPermission.PLATFORM_MODERATE or superadmin).
 *   - GET (list sanctions) is restricted to moderators/admins.
 *   - `issuedBy` is ALWAYS derived from ctx.userId — never trusted from
 *     the request body.
 *   - Body is validated with Zod.
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { withErrorHandler, forbidden, unauthorized } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import {
  listSanctions, createSanction, approveSanction, revokeSanction,
  supportsAllSanctionTypes, supportsAllSanctionStatuses,
} from "@/features/trust-platform";
import { can, PlatformPermission, type AuthContext } from "@/features/rbac";

function requireModerator(ctx: AuthContext): void {
  if (!ctx.userId) throw unauthorized("Authentication required");
  const allowed = can(ctx, PlatformPermission.PLATFORM_MODERATE) || can(ctx, PlatformPermission.TRUST_MANAGE);
  if (!allowed && !ctx.isSuperadmin) {
    throw forbidden("Moderator or admin permission required");
  }
}

const createSanctionSchema = z.object({
  targetUserId: z.string().min(1),
  type: z.string().min(1),
  reason: z.string().min(1).max(2000),
  durationHours: z.number().int().positive().optional(),
  evidence: z.string().max(5000).optional(),
});

const updateSanctionSchema = z.object({
  action: z.enum(["approve", "revoke"]),
  id: z.string().min(1),
  reason: z.string().min(1).max(2000).optional(),
});

export const GET = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  requireModerator(ctx);
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") as any;
  const type = searchParams.get("type") as any;
  return NextResponse.json({
    sanctions: listSanctions(status ?? undefined, type ?? undefined),
    types: supportsAllSanctionTypes(),
    statuses: supportsAllSanctionStatuses(),
  });
});

export const POST = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  requireModerator(ctx);
  const body = createSanctionSchema.parse(await req.json().catch(() => null));
  // issuedBy is ALWAYS the verified caller — never trusted from the body.
  const sanction = createSanction({ ...body, issuedBy: ctx.userId });
  return NextResponse.json({ sanction }, { status: 201 });
});

export const PUT = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  requireModerator(ctx);
  const body = updateSanctionSchema.parse(await req.json().catch(() => null));
  let sanction = null;
  if (body.action === "approve") sanction = approveSanction(body.id, ctx.userId);
  else if (body.action === "revoke") sanction = revokeSanction(body.id, ctx.userId, body.reason ?? "");
  return NextResponse.json({ sanction });
});
