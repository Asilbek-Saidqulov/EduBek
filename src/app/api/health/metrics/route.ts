/** GET /api/health/metrics — Prometheus metrics
 *
 * SECURITY:
 *   - Liveness/readiness probes (GET /api/health/live, /api/health/ready)
 *     are intentionally unauthenticated — they're scraped by the load
 *     balancer / k8s probe with no auth header.
 *   - Metrics (this endpoint) expose internal counters, version info, and
 *     request volume. Restrict to either:
 *       (a) requests from loopback (Prometheus scraper on the same pod), OR
 *       (b) requests authenticated as admin.
 */
import { NextResponse } from "next/server";
import { metricsExport } from "@/infra/health";
import { getAuthContext } from "@/features/auth";
import { can, PlatformPermission } from "@/features/rbac";

function isLoopback(req: Request): boolean {
  const url = new URL(req.url);
  const host = url.hostname;
  if (host === "127.0.0.1" || host === "::1" || host === "localhost" || host === "[::1]") {
    return true;
  }
  const xff = req.headers.get("x-forwarded-for");
  if (!xff) return true; // no proxy = direct connection
  return false;
}

export const GET = async (req: Request) => {
  if (!isLoopback(req)) {
    const ctx = await getAuthContext();
    if (!ctx.userId || (!can(ctx, PlatformPermission.ANALYTICS_VIEW) && !ctx.isSuperadmin)) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
        { status: 401 },
      );
    }
  }
  const text = metricsExport();
  return new NextResponse(text, {
    status: 200,
    headers: { "Content-Type": "text/plain; version=0.0.4" },
  });
};
