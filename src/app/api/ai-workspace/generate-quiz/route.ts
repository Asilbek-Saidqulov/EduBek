import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateStructuredJson, AiError } from "@/lib/ai";
import { checkRateLimit } from "@/lib/rate-limiter";
import { getAuthContext } from "@/features/auth";
import { db } from "@/lib/db";

const requestSchema = z.object({
  topic: z
    .string()
    .trim()
    .min(2, "Topic must be at least 2 characters")
    .max(1000, "Topic is too long"),
  count: z.coerce.number().int().min(1).max(10).default(5),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]).default("intermediate"),
  locale: z.enum(["uz", "en", "ru"]).optional(),
});

const quizOutputSchema = z.object({
  topic: z.string(),
  difficulty: z.string(),
  questions: z.array(
    z.object({
      question: z.string().min(5, "Question must be at least 5 characters"),
      options: z
        .array(z.string().min(1, "Option cannot be empty"))
        .length(4, "Must have exactly 4 options"),
      correctIndex: z.number().int().min(0).max(3),
      explanation: z.string().min(5, "Explanation must be at least 5 characters"),
    })
  ).min(1, "At least one question must be generated"),
});

const EDU_TOKENS_PER_GENERATION = 10;

export async function POST(req: NextRequest) {
  try {
    // 1. Rate Limiting
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "anonymous";
    const rateLimit = checkRateLimit(`ai:generate-quiz:${ip}`, 12, 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: {
            code: "RATE_LIMITED",
            message: "Too many quiz generation requests. Please wait a minute before trying again.",
          },
        },
        { status: 429 }
      );
    }

    // 2. Validate input payload
    const body = await req.json().catch(() => null);
    const parsedInput = requestSchema.safeParse(body);
    if (!parsedInput.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid quiz generation parameters",
            issues: parsedInput.error.issues,
          },
        },
        { status: 400 }
      );
    }

    const { topic, count, difficulty, locale: reqLocale } = parsedInput.data;

    // 3. User & Token check
    const authContext = await getAuthContext().catch(() => null);
    const userId = authContext?.userId;
    const locale = reqLocale || authContext?.locale || "uz";

    let userWallet = null;
    if (userId) {
      userWallet = await db.wallet.findUnique({
        where: { userId },
      });

      // If user has wallet and insufficient tokens
      if (userWallet && userWallet.eduTokensBalance < EDU_TOKENS_PER_GENERATION) {
        return NextResponse.json(
          {
            error: {
              code: "INSUFFICIENT_TOKENS",
              message: `Insufficient EduTokens. Quiz generation requires ${EDU_TOKENS_PER_GENERATION} EDU. Your balance is ${userWallet.eduTokensBalance} EDU.`,
            },
          },
          { status: 402 }
        );
      }
    }

    // 4. Construct AI Prompt with language instructions
    const languageInstruction =
      locale === "uz"
        ? "MUHIM: Barcha savollar, variantlar va tushuntirishlarni o'zbek tilida (lotin yozuvida) yarating."
        : locale === "ru"
        ? "ВАЖНО: Создайте все вопросы, варианты ответов и объяснения на русском языке."
        : "IMPORTANT: Create all questions, options, and explanations in English.";

    const systemPrompt = `You are an expert curriculum developer, educator, and assessment creator for the EduBek platform.
Your task is to generate high quality, syllabus-aligned multiple choice questions.
${languageInstruction}

Rules:
1. Each question must test genuine conceptual understanding or problem-solving.
2. Every question must have exactly 4 plausible, mutually exclusive options.
3. correctIndex MUST accurately correspond to the single correct option (0, 1, 2, or 3).
4. Provide a clear, educational, step-by-step explanation for why the correct option is true and how to derive it.
5. Difficulty: ${difficulty}.
6. Total questions: ${count}.`;

    const userPrompt = `Generate a ${count}-question multiple choice quiz on the topic: "${topic}".
Difficulty level: ${difficulty}.
Return valid JSON with the structure:
{
  "topic": "${topic}",
  "difficulty": "${difficulty}",
  "questions": [
    {
      "question": "Question text...",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Step-by-step reasoning..."
    }
  ]
}`;

    // 5. Generate structured JSON with Gemini
    const result = await generateStructuredJson({
      prompt: userPrompt,
      systemPrompt,
      schema: quizOutputSchema,
      temperature: 0.4,
    });

    // 6. Deduct EduTokens and log usage atomically upon success
    if (userId) {
      try {
        await db.$transaction(async (tx) => {
          let wallet = await tx.wallet.findUnique({
            where: { userId },
          });

          if (!wallet) {
            wallet = await tx.wallet.create({
              data: {
                userId,
                eduTokensBalance: 250,
                fiatBalance: 0,
                currency: "USD",
              },
            });
          }

          if (wallet.eduTokensBalance < EDU_TOKENS_PER_GENERATION) {
            console.warn(
              `[generate-quiz] User ${userId} had insufficient tokens (${wallet.eduTokensBalance}) at transaction commit.`
            );
            return;
          }

          const newBalance = wallet.eduTokensBalance - EDU_TOKENS_PER_GENERATION;

          await tx.wallet.update({
            where: { id: wallet.id },
            data: { eduTokensBalance: newBalance },
          });

          await tx.eduTokenLedger.create({
            data: {
              walletId: wallet.id,
              delta: -EDU_TOKENS_PER_GENERATION,
              balanceAfter: newBalance,
              reason: "purchase",
              referenceType: "ai_quiz_generation",
              metadata: JSON.stringify({ topic, count, difficulty }),
            },
          });

          const today = new Date();
          today.setHours(0, 0, 0, 0);

          await tx.aiUsageLog.upsert({
            where: {
              userId_day_model_feature: {
                userId,
                day: today,
                model: result.meta.model,
                feature: "quiz_generate",
              },
            },
            update: {
              requests: { increment: 1 },
              tokensIn: { increment: result.meta.tokensIn || 0 },
              tokensOut: { increment: result.meta.tokensOut || 0 },
            },
            create: {
              userId,
              day: today,
              model: result.meta.model,
              feature: "quiz_generate",
              requests: 1,
              tokensIn: result.meta.tokensIn || 0,
              tokensOut: result.meta.tokensOut || 0,
            },
          });
        });
      } catch (ledgerError) {
        console.error("Failed to deduct tokens / log usage:", ledgerError);
        // Do not fail the user request if ledger fails after AI generation succeeded
      }
    }

    return NextResponse.json({
      success: true,
      topic: result.data.topic || topic,
      difficulty: result.data.difficulty || difficulty,
      questions: result.data.questions,
      tokensDeducted: userId ? EDU_TOKENS_PER_GENERATION : 0,
      meta: {
        model: result.meta.model,
        latencyMs: result.meta.latencyMs,
      },
    });
  } catch (error: any) {
    console.error("AI Quiz Generation Error:", error);

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
          message: "Failed to generate quiz with AI. Please try again in a few moments.",
        },
      },
      { status: 500 }
    );
  }
}
