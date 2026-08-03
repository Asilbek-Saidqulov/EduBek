import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import {
  getPlatformSettings,
  updatePlatformSettings,
  updatePlatformSettingsBodySchema,
} from "@/features/platform-admin";

/** GET /api/admin/settings — platform settings (admin only). */
export const GET = withErrorHandler(async () => {
  const ctx = await getAuthContext();
  const settings = await getPlatformSettings(ctx);
  return NextResponse.json(settings);
});

/** PATCH /api/admin/settings — update platform settings (admin only). */
export const PATCH = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  const body = updatePlatformSettingsBodySchema.parse(await req.json());
  const settings = await updatePlatformSettings(ctx, body);
  return NextResponse.json(settings);
});
