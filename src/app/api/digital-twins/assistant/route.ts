/**
 * POST /api/digital-twins/assistant — Autonomous classroom assistant
 *
 * Body: { action: "prepare_next_week" | "execute_instruction", classroomId?, teacherId?, instruction?, ... }
 */
import { NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { prepareNextWeek, executeAutonomousInstruction } from "@/features/digital-twins";
import { z } from "zod";

const schema = z.object({
  action: z.enum(["prepare_next_week", "execute_instruction"]),
  classroomId: z.string().optional(),
  teacherId: z.string().optional(),
  studentId: z.string().optional(),
  organizationId: z.string().optional(),
  instruction: z.string().optional(),
  locale: z.string().optional(),
}).refine(
  (v) => v.action === "prepare_next_week" ? (v.classroomId && v.teacherId) : v.instruction,
  { message: "prepare_next_week requires classroomId + teacherId; execute_instruction requires instruction" },
);

export const POST = withErrorHandler(async (req) => {
  const ctx = await getAuthContext();
  if (!ctx.userId) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 },
    );
  }
  const body = schema.parse(await req.json());

  if (body.action === "prepare_next_week") {
    const result = await prepareNextWeek({
      classroomId: body.classroomId!,
      teacherId: body.teacherId!,
      locale: body.locale,
    });
    return NextResponse.json(result, { status: 201 });
  }

  // execute_instruction
  const result = await executeAutonomousInstruction({
    instruction: body.instruction!,
    classroomId: body.classroomId,
    teacherId: body.teacherId,
    studentId: body.studentId,
    organizationId: body.organizationId,
    locale: body.locale,
  });
  return NextResponse.json(result, { status: 201 });
});
