import type { Server, Socket } from "socket.io";
import { prisma } from "@/lib/db";

const MAX_LEN = 500;
const rate = new Map<string, number>();

async function getAccess(userId: string, classroomId: string) {
  const [teacher, student] = await Promise.all([
    prisma.classroom.findFirst({
      where: { id: classroomId, teacherId: userId },
      select: { id: true },
    }),
    prisma.classroomStudent.findFirst({
      where: { classroomId, studentId: userId },
      select: { classroomId: true },
    }),
  ]);
  return { isTeacher: !!teacher, isMember: !!teacher || !!student };
}

export function registerClassroomChat(io: Server) {
  io.on("connection", (socket: Socket) => {
    const userId = (socket.data as any).userId as string;
    if (!userId || userId.startsWith("guest_")) return;

    socket.on("classroom:join", async (classroomId: string, ack?: (r: any) => void) => {
      const { isMember } = await getAccess(userId, classroomId);
      if (!isMember) return ack?.({ error: "not_found" });
      socket.join(`classroom:${classroomId}`);
      ack?.({ ok: true });
    });

    socket.on("classroom:leave", (classroomId: string) => {
      socket.leave(`classroom:${classroomId}`);
    });

    socket.on("classroom:send", async (payload: { classroomId: string; body: string }, ack?: (r: any) => void) => {
      const classroomId = payload?.classroomId;
      const room = `classroom:${classroomId}`;
      if (!socket.rooms.has(room)) return ack?.({ error: "not_found" });

      const now = Date.now();
      const last = rate.get(userId) || 0;
      if (now - last < 1000) return ack?.({ error: "rate_limited" });
      rate.set(userId, now);

      const text = String(payload?.body ?? "").trim();
      if (!text || text.length > MAX_LEN) return ack?.({ error: "invalid_body" });

      const { isMember } = await getAccess(userId, classroomId);
      if (!isMember) {
        socket.leave(room);
        return ack?.({ error: "not_found" });
      }

      const msg = await prisma.classroomMessage.create({
        data: { classroomId, authorId: userId, body: text },
        select: {
          id: true,
          classroomId: true,
          authorId: true,
          body: true,
          createdAt: true,
          author: { select: { name: true, username: true } },
        },
      });

      io.to(room).emit("classroom:message", msg);
      ack?.({ ok: true, id: msg.id });
    });

    socket.on("classroom:delete", async (payload: { messageId: string }, ack?: (r: any) => void) => {
      const msg = await prisma.classroomMessage.findUnique({
        where: { id: payload?.messageId },
        select: { id: true, classroomId: true, authorId: true, deletedAt: true },
      });
      if (!msg || msg.deletedAt) return ack?.({ error: "not_found" });

      const { isTeacher, isMember } = await getAccess(userId, msg.classroomId);
      if (!isMember || (msg.authorId !== userId && !isTeacher)) {
        return ack?.({ error: "not_found" });
      }

      await prisma.classroomMessage.update({
        where: { id: msg.id },
        data: { deletedAt: new Date(), deletedById: userId, body: "" },
      });

      io.to(`classroom:${msg.classroomId}`).emit("classroom:deleted", { id: msg.id });
      ack?.({ ok: true });
    });
  });
}
