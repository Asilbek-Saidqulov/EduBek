import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext, requireAuth } from "@/features/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const bodySchema = z.object({ username: z.string().min(2) });

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  requireAuth(ctx);

  const { username } = bodySchema.parse(await req.json());
  const target = await prisma.user.findUnique({ where: { username } });

  // Don't leak existence
  if (!target || target.id === ctx.userId) {
    return NextResponse.json({ error: "cannot_request" }, { status: 400 });
  }

  const existing = await prisma.friendship.findFirst({
    where: {
      OR: [
        { requesterId: ctx.userId, addresseeId: target.id },
        { requesterId: target.id, addresseeId: ctx.userId },
      ],
    },
  });

  if (existing) {
    if (existing.status === "BLOCKED") {
      return NextResponse.json({ error: "cannot_request" }, { status: 400 });
    }
    return NextResponse.json({ error: "already_exists" }, { status: 409 });
  }

  const friendship = await prisma.friendship.create({
    data: { requesterId: ctx.userId, addresseeId: target.id, status: "PENDING" },
  });

  return NextResponse.json({ ok: true, id: friendship.id }, { status: 201 });
});
