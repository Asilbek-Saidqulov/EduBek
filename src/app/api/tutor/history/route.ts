import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/features/auth/auth.context";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth.userId) {
      return NextResponse.json({ sessions: [] });
    }

    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");

    if (sessionId) {
      const conv = await prisma.aiConversation.findFirst({
        where: { id: sessionId, userId: auth.userId },
        include: {
          messages: {
            include: {
              toolCallRecords: {
                orderBy: { messageId: "asc" },
              },
            },
            orderBy: { createdAt: "asc" },
          },
        },
      });

      if (!conv) {
        return NextResponse.json({ error: "Session not found" }, { status: 404 });
      }

      let parsedMetadata: any = null;
      if (conv.metadata) {
        try {
          parsedMetadata = JSON.parse(conv.metadata);
        } catch {
          parsedMetadata = null;
        }
      }

      return NextResponse.json({
        session: {
          ...conv,
          parsedMetadata,
          blackboard: parsedMetadata?.blackboard || null,
        },
      });
    }

    // List recent sessions
    const sessions = await prisma.aiConversation.findMany({
      where: { userId: auth.userId },
      orderBy: { updatedAt: "desc" },
      take: 10,
      select: {
        id: true,
        title: true,
        metadata: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ sessions });
  } catch (error: any) {
    console.error("[Tutor History Error]:", error);
    return NextResponse.json({ error: "Failed to fetch tutor history" }, { status: 500 });
  }
}
