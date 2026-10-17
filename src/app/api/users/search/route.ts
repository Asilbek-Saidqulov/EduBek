import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext, requireAuth } from "@/features/auth";
import { prisma } from "@/lib/db";

export const GET = withErrorHandler(async (req: Request) => {
  const ctx = await getAuthContext();
  requireAuth(ctx);

  const { searchParams } = new URL(req.url);
  const username = searchParams.get("username")?.trim();
  if (!username || username.length < 2) {
    return NextResponse.json({ users: [] });
  }

  // Exact match only to prevent enumeration
  const user = await prisma.user.findUnique({
    where: { username },
    select: { id: true, username: true, name: true, avatarUrl: true },
  });

  if (!user || user.id === ctx.userId) {
    return NextResponse.json({ users: [] });
  }

  return NextResponse.json({ users: [user] });
});
