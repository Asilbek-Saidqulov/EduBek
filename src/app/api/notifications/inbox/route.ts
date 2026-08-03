/** GET/POST/PUT /api/notifications/inbox — Inbox platform */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { queryInbox, getInboxSummary, deliverToInbox, markInboxItemRead, markInboxItemArchived, markInboxItemDismissed, pinInboxItem, deleteInboxItem, markAllRead, clearInbox, supportsAllInboxStatuses } from "@/features/notifications-platform";

export const GET = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const { searchParams } = new URL(req.url);
  const result = queryInbox({
    userId: ctx.userId,
    status: (searchParams.get("status") as any) ?? undefined,
    category: (searchParams.get("category") as any) ?? undefined,
    priority: (searchParams.get("priority") as any) ?? undefined,
    searchText: searchParams.get("q") ?? undefined,
    limit: Number(searchParams.get("limit") ?? 50),
    offset: Number(searchParams.get("offset") ?? 0),
  });
  return NextResponse.json({ ...result, summary: getInboxSummary(ctx.userId), statuses: supportsAllInboxStatuses() });
});

export const POST = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const body = await req.json();
  const item = deliverToInbox(body);
  return NextResponse.json({ item }, { status: 201 });
});

export const PUT = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const body = await req.json();
  if (body.action === "markAllRead") return NextResponse.json({ updated: markAllRead(ctx.userId) });
  if (body.action === "clear") return NextResponse.json({ deleted: clearInbox(ctx.userId) });
  let item = null;
  if (body.action === "read") item = markInboxItemRead(ctx.userId, body.itemId);
  else if (body.action === "archive") item = markInboxItemArchived(ctx.userId, body.itemId);
  else if (body.action === "dismiss") item = markInboxItemDismissed(ctx.userId, body.itemId);
  else if (body.action === "pin") item = pinInboxItem(ctx.userId, body.itemId);
  else if (body.action === "delete") item = deleteInboxItem(ctx.userId, body.itemId);
  return NextResponse.json({ item });
});
