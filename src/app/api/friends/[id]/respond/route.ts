import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext, requireAuth } from "@/features/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const bodySchema = z.object({ action: z.enum(["accept", "decline", "block"]) });

export const POST = withErrorHandler(async (req, { params }) => {
  const ctx = await getAuthContext();
  requireAuth(ctx);
  const { id } = await params;
  const { action } = bodySchema.parse(await req.json());

  const friendship = await prisma.friendship.findUnique({ where: { id } });

  // Only the addressee can respond
  if (!friendship || friendship.addresseeId !== ctx.userId || friendship.status !== "PENDING") {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const statusMap = { accept: "ACCEPTED", decline: "DECLINED", block: "BLOCKED" } as const;
  const updated = await prisma.friendship.update({
    where: { id },
    data: { status: statusMap[action] },
  });

  return NextResponse.json({ ok: true, status: updated.status });
});
