/** GET/POST /api/notifications/messages — System messages */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { listSystemMessages, createSystemMessage, markSystemMessageDelivered, generateDigest, supportsAllSystemMessageTypes } from "@/features/notifications-platform";

export const GET = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") as any;
  return NextResponse.json({
    messages: listSystemMessages(type ?? undefined, ctx.userId),
    types: supportsAllSystemMessageTypes(),
  });
});

export const POST = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) { return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Authentication required" } }, { status: 401 }); }
  const body = await req.json();
  if (body.action === "deliver") return NextResponse.json({ message: markSystemMessageDelivered(body.id) });
  if (body.action === "digest") return NextResponse.json({ message: generateDigest(body.userId ?? ctx.userId, body.period) });
  const msg = createSystemMessage(body);
  return NextResponse.json({ message: msg }, { status: 201 });
});
