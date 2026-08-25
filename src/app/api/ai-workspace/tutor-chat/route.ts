import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { chatCompletion, AiError, type ChatMessage } from "@/lib/ai";
import { checkRateLimit } from "@/lib/rate-limiter";
import { getAuthContext } from "@/features/auth";
import { db } from "@/lib/db";

const chatRequestSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, "Message cannot be empty")
    .max(4000, "Message is too long"),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        text: z.string().max(4000),
      })
    )
    .optional()
    .default([]),
  locale: z.enum(["uz", "en", "ru"]).optional(),
  context: z.string().max(2000).optional(),
});

export async function POST(req: NextRequest) {
  try {
    // 1. Rate Limiting
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "anonymous";
    const rateLimit = checkRateLimit(`ai:tutor-chat:${ip}`, 25, 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: {
            code: "RATE_LIMITED",
            message: "Too many messages sent. Please wait a moment before sending another query.",
          },
        },
        { status: 429 }
      );
    }

    // 2. Validate input
    const body = await req.json().catch(() => null);
    const parsed = chatRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid tutor chat request",
            issues: parsed.error.issues,
          },
        },
        { status: 400 }
      );
    }

    const { message, history, locale: reqLocale, context } = parsed.data;

    // 3. User & Locale context
    const authContext = await getAuthContext().catch(() => null);
    const userId = authContext?.userId;
    const locale = reqLocale || authContext?.locale || "uz";

    const languageInstruction =
      locale === "uz"
        ? "MUHIM: Javobingizni o'quvchiga tushunarli, aniq o'zbek tilida (lotin yozuvida) bering. Formulalar va misollarni qadamma-qadam tushuntiring."
        : locale === "ru"
        ? "ВАЖНО: Отвечайте на чистом, понятном русском языке с пошаговыми объяснениями, примерами и формулами."
        : "IMPORTANT: Respond in clear, encouraging English with step-by-step explanations, formulas, and worked examples.";

    const systemPrompt = `You are EduBek AI Study Companion, an expert academic tutor and step-by-step problem solver for students.
${languageInstruction}

Your core tutoring guidelines:
1. Provide structured, intuitive explanations with clear headings, bullet points, and worked steps.
2. When answering math/science questions, write out all formulas clearly and explain what each variable represents.
3. If the student makes a mistake or asks a confusing problem, break it into manageable sub-steps and ask a friendly verification question at the end.
4. Keep explanations educational, engaging, concise, and aligned with standard curriculum subjects (Math, Physics, Chemistry, Biology, Computer Science, History, Languages).
${context ? `Additional lesson context provided by student:\n${context}` : ""}`;

    // Convert history to OpenRouter ChatMessage format
    const messages: ChatMessage[] = [];

    // Include last 6 turns of history for conversational context
    const recentHistory = history.slice(-6);
    for (const h of recentHistory) {
      messages.push({
        role: h.role,
        content: h.text,
      });
    }

    messages.push({
      role: "user",
      content: message,
    });

    // 4. Generate AI reply via OpenRouter
    const result = await chatCompletion({
      messages,
      systemPrompt,
      temperature: 0.7,
    });

    // 5. Optionally log usage
    if (userId) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      db.aiUsageLog
        .upsert({
          where: {
            userId_day_model_feature: {
              userId,
              day: today,
              model: result.meta.model,
              feature: "tutor_chat",
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
            feature: "tutor_chat",
            requests: 1,
            tokensIn: result.meta.tokensIn || 0,
            tokensOut: result.meta.tokensOut || 0,
          },
        })
        .catch(() => {});
    }

    return NextResponse.json({
      success: true,
      reply: result.text,
      meta: {
        model: result.meta.model,
        latencyMs: result.meta.latencyMs,
      },
    });
  } catch (error: any) {
    console.error("AI Tutor Chat Error:", error);

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
          message: "The AI Tutor service is temporarily unavailable. Please try again.",
        },
      },
      { status: 500 }
    );
  }
}
