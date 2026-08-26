import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthContext } from "@/features/auth/auth.context";
import { prisma } from "@/lib/db";

const SaveLessonSchema = z.object({
  title: z.string().min(1).max(200),
  subject: z.string().optional().default("General"),
  topic: z.string().optional().default("AI Tutor Lesson"),
  document: z.any(),
  visibility: z.enum(["private", "org", "public"]).default("private"),
});

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth.userId) {
      return NextResponse.json(
        { error: "Authentication required to save lessons to your library." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const parsed = SaveLessonSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid lesson data", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { title, subject, topic, document, visibility } = parsed.data;

    // Check if an existing resource with exact title and user exists to update, or create new
    const existing = await prisma.resource.findFirst({
      where: {
        ownerId: auth.userId,
        ownerType: "user",
        title,
        resourceType: "notes",
      },
    });

    let resource;
    if (existing) {
      resource = await prisma.resource.update({
        where: { id: existing.id },
        data: {
          content: typeof document === "string" ? document : JSON.stringify(document),
          metadata: JSON.stringify({ topic }),
          subject,
          visibility,
          updatedAt: new Date(),
        },
      });
    } else {
      resource = await prisma.resource.create({
        data: {
          ownerId: auth.userId,
          ownerType: "user",
          title,
          resourceType: "notes",
          subject,
          metadata: JSON.stringify({ topic }),
          content: typeof document === "string" ? document : JSON.stringify(document),
          visibility,
        },
      });
    }

    return NextResponse.json({
      success: true,
      resourceId: resource.id,
      title: resource.title,
      updatedAt: resource.updatedAt,
    });
  } catch (error: any) {
    console.error("[Tutor Save Route Error]:", error);
    return NextResponse.json(
      { error: error.message || "Failed to save lesson to library." },
      { status: 500 }
    );
  }
}
