import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateText, AiError } from "@/lib/ai";
import { checkRateLimit } from "@/lib/rate-limiter";
import { getAuthContext } from "@/features/auth";

const explainRequestSchema = z.object({
  question: z.string().trim().min(3, "Question is required"),
  options: z.array(z.string().trim()).min(2, "Options are required"),
  selectedOption: z.string().trim().optional(),
  correctOption: z.string().trim().min(1, "Correct option is required"),
  topic: z.string().trim().optional(),
  locale: z.enum(["uz", "en", "ru"]).optional(),
});

export async function POST(req: NextRequest) {
  try {
    // 1. Rate Limiting
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "anonymous";
    const rateLimit = checkRateLimit(`ai:explain-q:${ip}`, 30, 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: {
            code: "RATE_LIMITED",
            message: "Too many explanation requests. Please wait a moment before requesting another.",
          },
        },
        { status: 429 }
      );
    }

    // 2. Validate input
    const body = await req.json().catch(() => null);
    const parsed = explainRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid question explanation request",
            issues: parsed.error.issues,
          },
        },
        { status: 400 }
      );
    }

    const { question, options, selectedOption, correctOption, topic, locale: reqLocale } = parsed.data;

    const authContext = await getAuthContext().catch(() => null);
    const locale = reqLocale || authContext?.locale || "uz";

    const languageInstruction =
      locale === "uz"
        ? "MUHIM: Tushuntirishni aniq, tushunarli o'zbek tilida (lotin yozuvida) bering."
        : locale === "ru"
        ? "ВАЖНО: Дайте понятное, структурированное объяснение на русском языке."
        : "IMPORTANT: Provide a clear, structured explanation in English.";

    const isMistake = selectedOption && selectedOption !== correctOption;

    const systemPrompt = `You are EduBek AI Study Tutor, an expert teacher diagnosing quiz questions and breaking down student misconceptions.
${languageInstruction}

Your task:
Explain why the correct answer is "${correctOption}" and provide a concise, high-value step-by-step breakdown.
${
  isMistake
    ? `The student selected "${selectedOption}", which was incorrect. Explain the conceptual slip or calculation trap in that selection.`
    : ""
}

Formatting:
1. **Core Concept / Rule**: The foundational definition or formula.
2. **Step-by-Step Derivation**: How to derive the correct choice.
3. **Key Takeaway / Tip**: How to remember or verify this next time.
Keep it educational, encouraging, and under 150 words.`;

    const userPrompt = `Question: "${question}"
${topic ? `Topic/Subject: ${topic}\n` : ""}
Options:
${options.map((opt, i) => `${String.fromCharCode(65 + i)}. ${opt}`).join("\n")}

Student's Answer: ${selectedOption || "Not answered"}
Correct Answer: ${correctOption}`;

    const result = await generateText({
      prompt: userPrompt,
      systemPrompt,
      temperature: 0.3,
    });

    return NextResponse.json({
      success: true,
      explanation: result.text,
      meta: {
        model: result.meta.model,
        latencyMs: result.meta.latencyMs,
      },
    });
  } catch (error: any) {
    console.error("Explain Question Error:", error);

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
          message: "Failed to generate AI explanation. Please try again.",
        },
      },
      { status: 500 }
    );
  }
}
