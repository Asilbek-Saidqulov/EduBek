/** GET/POST /api/notifications/channels — Delivery channels */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listChannels, registerChannel, setChannelStatus, supportsAllDeliveryChannels, supportsAllChannelStatuses } from "@/features/notifications-platform";

export const GET = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") as any;
  return NextResponse.json({
    channels: listChannels(status ?? undefined),
    channelIds: supportsAllDeliveryChannels(),
    statuses: supportsAllChannelStatuses(),
  });
});

export const POST = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const body = await req.json();
  if (body.action === "setStatus") {
    return NextResponse.json({ channel: setChannelStatus(body.id, body.status) });
  }
  const channel = registerChannel(body);
  return NextResponse.json({ channel }, { status: 201 });
});
