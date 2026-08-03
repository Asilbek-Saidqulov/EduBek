import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { assignCreatorTier, assignCreatorTierBodySchema } from "@/features/platform-admin";

/** POST /api/admin/creator-tiers/assign — assign a tier to a creator. */
export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  const body = assignCreatorTierBodySchema.parse(await req.json());
  const assignment = await assignCreatorTier(ctx, body.creatorId, body.tierName);
  return NextResponse.json(assignment, { status: 201 });
});
