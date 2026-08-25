import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateStructuredJson, AiError } from "@/lib/ai";
import { checkRateLimit } from "@/lib/rate-limiter";
import { getAuthContext } from "@/features/auth";

const summarizeRequestSchema = z.object({
  text: z
    .string()
    .trim()
    .min(20, "Input text must be at least 20 characters")
    .max(8000, "Input text cannot exceed 8,000 characters"),
  mode: z.enum(["summary", "formulas", "flashcards"]).default("summary"),
  locale: z.enum(["uz", "en", "ru"]).optional(),
});

const summaryOutputSchema = z.object({
  title: z.string(),
  summary: z.string(),
  keyTakeaways: z.array(z.string()).min(1),
  formulas: z.array(
    z.object({
      name: z.string(),
      formula: z.string(),
      description: z.string(),
    })
  ).optional().default([]),
  flashcards: z.array(
    z.object({
      front: z.string(),
      back: z.string(),
    })
  ).optional().default([]),
});

export async function POST(req: NextRequest) {
  try {
    // 1. Rate Limiting
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "anonymous";
    const rateLimit = checkRateLimit(`ai:summarize:${ip}`, 15, 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: {
            code: "RATE_LIMITED",
            message: "Too many summarization requests. Please wait a moment before trying again.",
          },
        },
        { status: 429 }
      );
    }

    // 2. Validate input
    const body = await req.json().catch(() => null);
    const parsed = summarizeRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid study notes input",
            issues: parsed.error.issues,
          },
        },
        { status: 400 }
      );
    }

    const { text, mode, locale: reqLocale } = parsed.data;

    const authContext = await getAuthContext().catch(() => null);
    const locale = reqLocale || authContext?.locale || "uz";

    const languageInstruction =
      locale === "uz"
        ? "MUHIM: Xulosa, formulalar va kartochkalarni o'zbek tilida (lotin yozuvida) tayyorlang."
        : locale === "ru"
        ? "ВАЖНО: Подготовьте конспект, формулы и карточки на русском языке."
        : "IMPORTANT: Prepare all summaries, formulas, and flashcards in English.";

    const systemPrompt = `You are EduBek AI Study Assistant, an expert in educational summarization, active recall, and formula extraction.
${languageInstruction}

Your task:
Analyze the provided study text and create structured study materials based on mode: "${mode}".
Extract key definitions, core governing formulas (with variable explanations), and active recall flashcards.`;

    const userPrompt = `Analyze the following study material and generate structured learning study output:
Mode: ${mode}

Source Material:
"""
${text}
"""

Return valid JSON matching:
{
  "title": "Topic or Chapter Title",
  "summary": "Clear executive summary of the content...",
  "keyTakeaways": ["Key takeaway 1", "Key takeaway 2"],
  "formulas": [{"name": "Formula Name", "formula": "E = mc^2", "description": "Energy-mass equivalence"}],
  "flashcards": [{"front": "Active recall question", "back": "Concise answer"}]
}`;

    const result = await generateStructuredJson({
      prompt: userPrompt,
      systemPrompt,
      schema: summaryOutputSchema,
      temperature: 0.3,
    });

    return NextResponse.json({
      success: true,
      data: result.data,
      meta: {
        model: result.meta.model,
        latencyMs: result.meta.latencyMs,
      },
    });
  } catch (error: any) {
    console.error("AI Summarize Error:", error);

    if (error instanceof AiError) {
      return NextResponse.json(
        {
          error: {
            code: error.code,
            message: error.message,
          },
        },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to summarize study notes with AI. Please try again.",
        },
      },
      { status: 500 }
    );
  }
}
