/** GET/POST/PUT /api/notifications/announcements — Announcement platform */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listAnnouncements, createAnnouncement, submitAnnouncementForApproval, approveAnnouncement, rejectAnnouncement, publishAnnouncement, expireAnnouncement, retireAnnouncement, listActiveAnnouncements, supportsAllAnnouncementScopes, supportsAllAnnouncementStatuses } from "@/features/notifications-platform";

export const GET = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const { searchParams } = new URL(req.url);
  const scope = searchParams.get("scope") as any;
  const status = searchParams.get("status") as any;
  const active = searchParams.get("active");
  return NextResponse.json({
    announcements: active === "true" ? listActiveAnnouncements(scope) : listAnnouncements(scope, status),
    scopes: supportsAllAnnouncementScopes(),
    statuses: supportsAllAnnouncementStatuses(),
  });
});

export const POST = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const body = await req.json();
  const ann = createAnnouncement({ ...body, createdBy: ctx.userId });
  return NextResponse.json({ announcement: ann }, { status: 201 });
});

export const PUT = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const body = await req.json();
  let ann = null;
  if (body.action === "submit") ann = submitAnnouncementForApproval(body.id);
  else if (body.action === "approve") ann = approveAnnouncement(body.id, ctx.userId);
  else if (body.action === "reject") ann = rejectAnnouncement(body.id, ctx.userId, body.reason);
  else if (body.action === "publish") ann = publishAnnouncement(body.id);
  else if (body.action === "expire") ann = expireAnnouncement(body.id);
  else if (body.action === "retire") ann = retireAnnouncement(body.id);
  return NextResponse.json({ announcement: ann });
});
