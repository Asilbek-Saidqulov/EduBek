import { z } from "zod";
import { db } from "@/lib/db";
import { generateText, generateStructuredJson, type ChatMessage } from "@/lib/ai";
import { type AuthContext } from "@/features/auth";

// 1. Schemas
export const generateBodySchema = z.object({
  topic: z.string().trim().min(2, "Topic must be at least 2 characters").max(1000),
  resourceType: z.enum(["lesson_plan", "worksheet", "quiz", "summary", "flashcards"]).default("lesson_plan"),
  grade: z.string().optional(),
  language: z.enum(["uz", "en", "ru"]).optional().default("uz"),
  instructions: z.string().max(2000).optional(),
});
export type GenerateBodyInput = z.infer<typeof generateBodySchema>;

export const editBodySchema = z.object({
  content: z.string().trim().min(10, "Content must be at least 10 characters").max(10000),
  instruction: z.string().trim().min(3, "Instruction is required").max(2000),
  locale: z.enum(["uz", "en", "ru"]).optional(),
});
export type EditBodyInput = z.infer<typeof editBodySchema>;

export const convertBodySchema = z.object({
  content: z.string().trim().min(10, "Content is required").max(10000),
  targetFormat: z.enum(["quiz", "flashcards", "summary", "lesson_plan"]),
  locale: z.enum(["uz", "en", "ru"]).optional(),
});
export type ConvertBodyInput = z.infer<typeof convertBodySchema>;

export const createSessionBodySchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  context: z.string().max(2000).optional(),
});
export type CreateSessionInput = z.infer<typeof createSessionBodySchema>;

const generatedResourceSchema = z.object({
  title: z.string(),
  summary: z.string(),
  contentMarkdown: z.string(),
  sections: z.array(
    z.object({
      heading: z.string(),
      body: z.string(),
    })
  ).optional().default([]),
  keyTerms: z.array(
    z.object({
      term: z.string(),
      definition: z.string(),
    })
  ).optional().default([]),
});

// 2. Resource Generation
export async function generateResource(ctx: AuthContext, input: GenerateBodyInput) {
  const locale = input.language || (ctx as any)?.locale || "uz";
  const languageInstruction =
    locale === "uz"
      ? "MUHIM: Resursni to'liq o'zbek tilida (lotin yozuvida), o'qituvchilar va o'quvchilar uchun qulay formatda yarating."
      : locale === "ru"
      ? "ВАЖНО: Создайте ресурс полностью на русском языке в структурированном академическом формате."
      : "IMPORTANT: Create the entire educational resource in English in a clean, structured format.";

  const systemPrompt = `You are an expert curriculum designer and educational content creator for EduBek.
${languageInstruction}

Your task:
Generate a complete, high-quality, syllabus-aligned ${input.resourceType} for the topic "${input.topic}".
${input.grade ? `Target Grade / Level: ${input.grade}` : ""}
${input.instructions ? `Special Instructions: ${input.instructions}` : ""}`;

  const userPrompt = `Create a comprehensive ${input.resourceType} on "${input.topic}".
Return valid JSON with title, executive summary, contentMarkdown, structured sections, and keyTerms.`;

  const result = await generateStructuredJson({
    prompt: userPrompt,
    systemPrompt,
    schema: generatedResourceSchema,
    temperature: 0.4,
  });

  return {
    success: true,
    data: result.data,
    meta: result.meta,
  };
}

// 3. Resource Editing with AI
export async function editResource(ctx: AuthContext, input: EditBodyInput) {
  const locale = input.locale || (ctx as any)?.locale || "uz";
  const systemPrompt = `You are an expert educational editor. Edit and improve the provided learning material according to the user's instructions while preserving accuracy, pedagogical tone, and language (${locale}).`;

  const userPrompt = `Original Content:
"""
${input.content}
"""

Editing Instruction: "${input.instruction}"

Return the revised content with clear improvements.`;

  const result = await generateText({
    prompt: userPrompt,
    systemPrompt,
    temperature: 0.3,
  });

  return {
    success: true,
    editedContent: result.text,
    meta: result.meta,
  };
}

// 4. Resource Format Conversion with AI
export async function convertResource(ctx: AuthContext, input: ConvertBodyInput) {
  const locale = input.locale || (ctx as any)?.locale || "uz";
  const systemPrompt = `You are an educational AI specialized in converting educational materials into new pedagogical formats (e.g. converting lecture notes into quizzes, flashcards, or lesson plans).
Language: ${locale}.`;

  const userPrompt = `Convert the following content into format: "${input.targetFormat}".

Source Content:
"""
${input.content}
"""

Return valid JSON with title, summary, and contentMarkdown.`;

  const result = await generateStructuredJson({
    prompt: userPrompt,
    systemPrompt,
    schema: generatedResourceSchema,
    temperature: 0.3,
  });

  return {
    success: true,
    data: result.data,
    meta: result.meta,
  };
}

// 5. Intelligent Suggestions & Templates
export async function getSuggestions(ctx: AuthContext, ...args: any[]) {
  return {
    success: true,
    suggestions: [
      {
        topic: "Quadratic Equations and Factoring",
        category: "Mathematics",
        prompt: "Generate a 5-question intermediate algebra quiz on quadratic formula derivations.",
      },
      {
        topic: "Newton's Laws of Motion",
        category: "Physics",
        prompt: "Explain Newton's third law with everyday examples and free-body diagram steps.",
      },
      {
        topic: "Cellular Respiration Stages",
        category: "Biology",
        prompt: "Summarize Glycolysis vs Krebs Cycle in a clear comparison table.",
      },
      {
        topic: "Algorithms and Big O Notation",
        category: "Computer Science",
        prompt: "Create practice questions on Array vs Linked List time complexity.",
      },
    ],
  };
}

export async function listPromptTemplates(ctx: AuthContext, ...args: any[]) {
  return {
    success: true,
    templates: [
      {
        id: "tpl-quiz-1",
        title: "Standard Multiple Choice Quiz",
        type: "quiz",
        description: "Creates 5-10 syllabus-aligned MCQs with 4 options and worked explanations.",
      },
      {
        id: "tpl-lesson-1",
        title: "50-Minute Lesson Plan",
        type: "lesson_plan",
        description: "Structures a complete 50-min class period: warm-up, core concept, student practice, and exit ticket.",
      },
      {
        id: "tpl-flashcard-1",
        title: "Active Recall Flashcards",
        type: "flashcards",
        description: "Extracts key vocabulary, definitions, and formulas into two-sided study cards.",
      },
      {
        id: "tpl-summary-1",
        title: "Executive Chapter Summary",
        type: "summary",
        description: "Condenses lecture notes into core takeaways and formula reference sheets.",
      },
    ],
  };
}

// 6. Session & History Persistence
export async function createSession(ctx: AuthContext, input: CreateSessionInput) {
  if (!ctx.userId) {
    return {
      success: true,
      sessionId: `guest_${Date.now()}`,
      title: input.title || "Guest Study Session",
      createdAt: new Date().toISOString(),
    };
  }

  const session = await db.aiConversation.create({
    data: {
      userId: ctx.userId,
      title: input.title || "AI Study Session",
      contextSummary: input.context || null,
    },
  });

  return {
    success: true,
    sessionId: session.id,
    title: session.title,
    createdAt: session.createdAt.toISOString(),
  };
}

export async function getSession(ctx: AuthContext, id: string) {
  if (!ctx.userId) {
    return {
      success: true,
      session: { id, title: "Guest Session", messages: [] },
    };
  }

  const session = await db.aiConversation.findFirst({
    where: { id, userId: ctx.userId },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  return {
    success: true,
    session,
  };
}

export async function getSessions(ctx: AuthContext) {
  if (!ctx.userId) {
    return { success: true, sessions: [] };
  }

  const sessions = await db.aiConversation.findMany({
    where: { userId: ctx.userId, isArchived: false },
    orderBy: { updatedAt: "desc" },
    take: 20,
  });

  return {
    success: true,
    sessions,
  };
}

export async function getGenerationHistory(ctx: AuthContext) {
  if (!ctx.userId) {
    return { success: true, history: [] };
  }

  const history = await db.aiUsageLog.findMany({
    where: { userId: ctx.userId },
    orderBy: { day: "desc" },
    take: 30,
  });

  return {
    success: true,
    history,
  };
}
