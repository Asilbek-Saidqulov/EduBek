/** GET /api/notifications/status — Platform status */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getNotificationStatus } from "@/features/notifications-platform";

export const GET = withErrorHandler(async () => {
  return NextResponse.json(getNotificationStatus());
});
