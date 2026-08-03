/** GET /api/progression/dashboard — Player progress dashboard (read-only) */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { generateProgressDashboard, generateProgressionDashboard, exportProfileCSV } from "@/features/player-progression";

export const GET = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId") ?? ctx.userId;
  const audience = (searchParams.get("audience") ?? "player") as "player" | "teacher" | "organization" | "platform";
  const format = searchParams.get("format");

  // CSV export
  if (format === "csv") {
    const csv = exportProfileCSV(userId);
    if (!csv) {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "Profile not found" } }, { status: 404 });
    }
    return new NextResponse(csv, {
      headers: { "Content-Type": "text/csv", "Content-Disposition": `attachment; filename="progression-${userId}.csv"` },
    });
  }

  // Player dashboard (default)
  if (audience === "player") {
    const dashboard = generateProgressDashboard(userId);
    if (!dashboard) {
      return NextResponse.json({ error: { code: "NOT_FOUND", message: "Profile not found" } }, { status: 404 });
    }
    return NextResponse.json(dashboard);
  }

  // Teacher / organization / platform dashboard
  return NextResponse.json(generateProgressionDashboard({
    audience,
    userId: null,
    organizationId: searchParams.get("organizationId"),
  }));
});
