/** GET /api/health/ready — readiness probe */
import { NextResponse } from "next/server";
import { readinessCheck } from "@/infra/health";

export const GET = async () => {
  const result = await readinessCheck();
  const status = result.status === "healthy" ? 200 : 503;
  return NextResponse.json(result, { status });
};
