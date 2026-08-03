/** GET/POST /api/notifications/schedules — Notification scheduling */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listSchedules, createSchedule, dispatchSchedule, completeSchedule, failSchedule, cancelSchedule, expireSchedule, listDueSchedules, supportsAllScheduleTypes, supportsAllScheduleStatuses } from "@/features/notifications-platform";

export const GET = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") as any;
  const type = searchParams.get("type") as any;
  const due = searchParams.get("due");
  return NextResponse.json({
    schedules: due === "true" ? listDueSchedules() : listSchedules(status ?? undefined, type ?? undefined),
    types: supportsAllScheduleTypes(),
    statuses: supportsAllScheduleStatuses(),
  });
});

export const POST = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const body = await req.json();
  if (body.action === "dispatch") return NextResponse.json({ schedule: dispatchSchedule(body.id) });
  if (body.action === "complete") return NextResponse.json({ schedule: completeSchedule(body.id) });
  if (body.action === "fail") return NextResponse.json({ schedule: failSchedule(body.id, body.reason) });
  if (body.action === "cancel") return NextResponse.json({ schedule: cancelSchedule(body.id, body.reason) });
  if (body.action === "expire") return NextResponse.json({ schedule: expireSchedule(body.id) });
  const schedule = createSchedule(body);
  return NextResponse.json({ schedule }, { status: 201 });
});
