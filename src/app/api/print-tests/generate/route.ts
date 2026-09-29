import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthContext } from "@/features/auth";
import {
  extractPlainText,
  generatePrintPack,
  type LocaleCode,
} from "@/features/print-tests/engine";

const bodySchema = z.object({
  title: z.string().max(160).optional(),
  subject: z.string().max(80).optional(),
  grade: z.string().max(40).optional(),
  locale: z.enum(["en", "uz", "ru"]).optional(),
  studentCount: z.coerce.number().int().min(1).max(40),
  questionCount: z.coerce.number().int().min(3).max(35),
  materialText: z.string().max(40000).optional(),
  sourceName: z.string().max(180).optional(),
  studentNames: z.array(z.string().max(80)).max(40).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthContext().catch(() => null);
    const body = bodySchema.parse(await req.json());
    const locale = (body.locale || (auth as { locale?: string } | null)?.locale || "en") as LocaleCode;
    const pack = generatePrintPack({
      ...body,
      locale,
      materialText: body.materialText ? extractPlainText(body.sourceName || "notes.txt", body.materialText) : "",
    });
    return NextResponse.json({
      success: true,
      pack,
      teacherId: auth?.userId || null,
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", issues: error.issues } },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Could not build print variants." } },
      { status: 500 }
    );
  }
}
