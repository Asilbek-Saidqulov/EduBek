/** GET/POST /api/telemetry/services — Service registry */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listServices, registerService, supportsAllServiceCategories, supportsAllServiceCriticalities } from "@/features/telemetry-platform";

export const GET = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") as any;
  const active = searchParams.get("active");
  return NextResponse.json({
    services: listServices(category ?? undefined, active === null ? undefined : active === "true"),
    categories: supportsAllServiceCategories(), criticalities: supportsAllServiceCriticalities(),
  });
});

export const POST = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const body = await req.json();
  const service = registerService(body);
  return NextResponse.json({ service }, { status: 201 });
});
