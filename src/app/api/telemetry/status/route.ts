/** GET /api/telemetry/status — Platform status */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getTelemetryStatus } from "@/features/telemetry-platform";

export const GET = withErrorHandler(async () => {
  return NextResponse.json(getTelemetryStatus());
});
