import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { chatCompletion, AiError, type ChatMessage, getTutorModel } from "@/lib/ai";
import { checkRateLimit } from "@/lib/rate-limiter";
import { getAuthContext } from "@/features/auth";
import { db } from "@/lib/db";
import {
  getStudentMemory,
  formatStudentMemoryForPrompt,
  extractAndPersistConversationMemories,
} from "@/lib/tutor/student-memory";

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
    const rateLimit = checkRateLimit(`ai:tutor-chat:${ip}`, 30, 60 * 1000);
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

    // 4. Fetch persistent Student Memory for personalized Socratic tutoring
    let memoryBlock = "";
    if (userId) {
      try {
        const studentMemory = await getStudentMemory(userId, context);
        memoryBlock = formatStudentMemoryForPrompt(studentMemory, locale);
      } catch (memErr) {
        console.warn("[tutor-chat memory fetch error]", memErr);
      }
    }

    const languageInstruction =
      locale === "uz"
        ? "MUHIM: Javobingizni o'quvchiga tushunarli, samimiy, aniq o'zbek tilida (lotin yozuvida) bering. Formulalar va misollarni qadamma-qadam tushuntiring. Sokratik uslubda savollar bilan o'quvchini mustaqil fikrlashga undang."
        : locale === "ru"
        ? "ВАЖНО: Отвечайте на чистом, понятном русском языке с пошаговыми объяснениями, примерами и формулами. Используйте Сократовский метод для вовлечения ученика."
        : "IMPORTANT: Respond in clear, encouraging English with step-by-step explanations, formulas, and worked examples. Use Socratic questioning to guide understanding.";

    const systemPrompt = `You are EduBek AI Tutor, an intelligent, empathetic, and Socratic academic educator powered by Qwen3.5-Flash.
${languageInstruction}

Your core tutoring guidelines:
1. Socratic & Step-by-Step: Never just dump raw final answers. Walk the student through intuitive, logical steps.
2. Mathematical & Scientific Rigor: Write all formulas in clear standard LaTeX ($inline$ and $$block$$). Explain each variable.
3. Diagnostic & Adaptive: Identify student misconceptions gently and address root causes.
4. Encourage & Verify: Ask a targeted concept-check question at the end to confirm understanding.
${memoryBlock ? `\n${memoryBlock}` : ""}
${context ? `\nAdditional Lesson Context:\n${context}` : ""}`;

    // Convert history to OpenRouter ChatMessage format
    const messages: ChatMessage[] = [];

    // Include last 8 turns of history for conversational context
    const recentHistory = history.slice(-8);
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

    // 5. Generate AI reply via OpenRouter using dedicated Tutor model (Qwen3.5-Flash)
    const tutorModel = getTutorModel();
    const result = await chatCompletion({
      messages,
      systemPrompt,
      temperature: 0.4,
      model: tutorModel,
      maxTokens: 2500,
    });

    // 6. Asynchronously update student learning memory based on conversation
    if (userId) {
      extractAndPersistConversationMemories(
        userId,
        [...recentHistory.map((h) => ({ role: h.role, content: h.text })), { role: "user", content: message }, { role: "assistant", content: result.text }],
        context
      ).catch(() => {});
    }

    // 7. Telemetry & Usage logging
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
          code: "TUTOR_CHAT_FAILED",
          message: error?.message || "Failed to generate tutor response",
        },
      },
      { status: 500 }
    );
  }
}
