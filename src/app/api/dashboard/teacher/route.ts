/** GET /api/dashboard/teacher — Aggregated teacher dashboard (classrooms + insights + recommendations) */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { db } from "@/lib/db";
import { generateTeacherRecommendations } from "@/features/collaboration";
import { computeClassInsight } from "@/features/collaboration";

export const GET = withErrorHandler(async () => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 },
    );
  }

  // Fetch all classrooms owned by this teacher
  const classrooms = await db.classroom.findMany({
    where: { teacherId: ctx.userId, status: "active" },
    select: {
      id: true, name: true, description: true,
      students: { where: { status: "active" }, select: { studentId: true } },
    },
  });

  // Compute per-classroom insights (best-effort, won't fail the whole request)
  const insights = await Promise.all(
    classrooms.map(async (c) => {
      try {
        return await computeClassInsight(c.id);
      } catch {
        return null;
      }
    }),
  );

  // Generate fresh AI teacher recommendations
  const recommendations = await generateTeacherRecommendations({
    teacherId: ctx.userId,
    limit: 5,
  }).catch(() => []);

  return NextResponse.json({
    teacherId: ctx.userId,
    classroomCount: classrooms.length,
    classrooms: classrooms.map((c, idx) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      studentCount: c.students.length,
      insight: insights[idx],
    })),
    recommendations,
    generatedAt: new Date().toISOString(),
  });
});
