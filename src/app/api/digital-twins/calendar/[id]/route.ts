/** GET /api/digital-twins/calendar/:id — Get a calendar with events */
import { NextResponse } from "next/server";
import { withErrorHandler, notFound } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { getCalendar, activateCalendar } from "@/features/digital-twins";

export const GET = withErrorHandler<{ id: string }>(async (_req, ctx) => {
  const authCtx = await getAuthContext();
  if (!authCtx.userId) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 },
    );
  }
  const { id } = await ctx.params;
  const calendar = await getCalendar(id);
  if (!calendar) throw notFound("Calendar not found");
  return NextResponse.json(calendar);
});

/** POST /api/digital-twins/calendar/:id?action=activate — Activate a calendar */
export const POST = withErrorHandler<{ id: string }>(async (req, ctx) => {
  const authCtx = await getAuthContext();
  if (!authCtx.userId) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 },
    );
  }
  const { id } = await ctx.params;
  const url = new URL(req.url);
  const action = url.searchParams.get("action");
  if (action === "activate") {
    const calendar = await activateCalendar(id);
    return NextResponse.json(calendar);
  }
  return NextResponse.json(
    { error: { code: "VALIDATION_ERROR", message: "Unknown action" } },
    { status: 400 },
  );
});
