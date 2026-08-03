import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import {
  createCreatorTierBodySchema,
  listCreatorTiers,
  manageCreatorTiers,
} from "@/features/platform-admin";

/** GET /api/admin/creator-tiers — list all platform creator tiers. */
export const GET = withErrorHandler(async () => {
  const ctx = await getAuthContext();
  const tiers = await listCreatorTiers(ctx);
  return NextResponse.json({ tiers });
});

/** POST /api/admin/creator-tiers — create a new platform creator tier. */
export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  const body = createCreatorTierBodySchema.parse(await req.json());
  const result = await manageCreatorTiers(ctx, "create", body);
  return NextResponse.json(result, { status: 201 });
});
