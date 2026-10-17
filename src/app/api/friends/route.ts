import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext, requireAuth } from "@/features/auth";
import { prisma } from "@/lib/db";

export const GET = withErrorHandler(async () => {
  const ctx = await getAuthContext();
  requireAuth(ctx);

  const friendships = await prisma.friendship.findMany({
    where: {
      OR: [{ requesterId: ctx.userId }, { addresseeId: ctx.userId }],
    },
    include: {
      requester: { select: { id: true, username: true, name: true, avatarUrl: true } },
      addressee: { select: { id: true, username: true, name: true, avatarUrl: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const friends = friendships
    .filter((f) => f.status === "ACCEPTED")
    .map((f) => (f.requesterId === ctx.userId ? f.addressee : f.requester));

  const incoming = friendships.filter((f) => f.status === "PENDING" && f.addresseeId === ctx.userId);
  const outgoing = friendships.filter((f) => f.status === "PENDING" && f.requesterId === ctx.userId);

  return NextResponse.json({ friends, incoming, outgoing });
});
