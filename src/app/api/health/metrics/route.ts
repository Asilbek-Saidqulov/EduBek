/** GET /api/health/metrics — Prometheus metrics */
import { NextResponse } from "next/server";
import { metricsExport } from "@/infra/health";

export const GET = () => {
  const text = metricsExport();
  return new NextResponse(text, {
    status: 200,
    headers: { "Content-Type": "text/plain; version=0.0.4" },
  });
};
