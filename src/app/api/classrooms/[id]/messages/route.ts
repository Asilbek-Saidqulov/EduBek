import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext, requireAuth } from "@/features/auth";
import { prisma } from "@/lib/db";

export const GET = withErrorHandler(async (req, { params }) => {
  const ctx = await getAuthContext();
  requireAuth(ctx);
  const { id: classroomId } = await params;

  const access = await Promise.all([
    prisma.classroom.findFirst({ where: { id: classroomId, teacherId: ctx.userId }, select: { id: true } }),
    prisma.classroomStudent.findFirst({ where: { classroomId, studentId: ctx.userId }, select: { classroomId: true } }),
  ]);
  if (!access[0] && !access[1]) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get("cursor");
  const take = 30;

  const messages = await prisma.classroomMessage.findMany({
    where: { classroomId },
    orderBy: { createdAt: "desc" },
    take: take + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    select: {
      id: true,
      authorId: true,
      body: true,
      createdAt: true,
      deletedAt: true,
      author: { select: { name: true, username: true } },
    },
  });

  const hasMore = messages.length > take;
  const items = messages.slice(0, take).map((m) => ({
    ...m,
    body: m.deletedAt ? null : m.body,
  }));

  return NextResponse.json({
    messages: items.reverse(),
    nextCursor: hasMore ? messages[take - 1]?.id : null,
  });
});
