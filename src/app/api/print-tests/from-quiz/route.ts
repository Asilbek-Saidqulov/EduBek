import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthContext } from "@/features/auth";
import { generatePrintPack, readableMaterial, type LocaleCode } from "@/features/print-tests/engine";
import { buildItemBank } from "@/features/print-tests/ai-bank";
import { savePrintPack } from "@/features/print-tests/store";

const bodySchema = z.object({
  topic: z.string().trim().min(2).max(1000),
  count: z.coerce.number().int().min(3).max(35).default(5),
  difficulty: z.string().max(40).optional(),
  uniquePapers: z.boolean().optional(),
  studentCount: z.coerce.number().int().min(1).max(40).optional(),
  materialText: z.string().max(40000).optional(),
  locale: z.enum(["en", "uz", "ru"]).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthContext().catch(() => null);
    const body = bodySchema.parse(await req.json());
    const locale = (body.locale || (auth as { locale?: string } | null)?.locale || "en") as LocaleCode;
    const materialText = readableMaterial([body.topic, body.materialText || ""].filter(Boolean).join("\n"));
    const bank = await buildItemBank({
      title: body.topic,
      subject: body.topic,
      locale,
      materialText,
      questionCount: body.count,
    });
    const studentCount = body.uniquePapers ? body.studentCount || 12 : 1;
    const pack = generatePrintPack({
      title: body.topic,
      subject: body.topic,
      locale,
      studentCount,
      questionCount: body.count,
      materialText,
      sourceName: "Created quiz",
      bank: bank || undefined,
    });
    if (auth?.userId) {
      await savePrintPack(auth.userId, pack).catch(() => null);
    }
    const shared = pack.sheets[0]?.questions || [];
    return NextResponse.json({
      success: true,
      pack,
      questions: shared.map((item) => ({
        question: item.prompt,
        options: item.options || [item.answer],
        correctIndex: Math.max(0, (item.options || [item.answer]).indexOf(item.answer)),
        explanation: item.work || "",
      })),
      tokensDeducted: 0,
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: { code: "VALIDATION_ERROR", issues: error.issues } }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Could not create the quiz.";
    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message } }, { status: 500 });
  }
}
