/** GET/POST /api/telemetry/export — Export platform */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listExportConfigs, registerExportConfig, exportMetrics, supportsAllExportFormats } from "@/features/telemetry-platform";

export const GET = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const { searchParams } = new URL(req.url);
  const format = searchParams.get("format") as any;
  // If format specified and `data=true`, return exported payload
  if (format && searchParams.get("data") === "true") {
    const payload = exportMetrics(format);
    return new NextResponse(payload, { headers: { "Content-Type": format === "prometheus" ? "text/plain; charset=utf-8" : "application/json" } });
  }
  return NextResponse.json({
    configs: listExportConfigs(format ?? undefined),
    formats: supportsAllExportFormats(),
  });
});

export const POST = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const body = await req.json();
  const config = registerExportConfig(body);
  return NextResponse.json({ config }, { status: 201 });
});
