/** GET /api/health/live — liveness probe */
import { NextResponse } from "next/server";
import { livenessCheck } from "@/infra/health";
import { withCorrelationId } from "@/infra/correlation";

export const GET = withCorrelationId(async () => {
  const result = livenessCheck();
  return NextResponse.json(result, { status: 200 });
});
