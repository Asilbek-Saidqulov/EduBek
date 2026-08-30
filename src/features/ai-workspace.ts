import { z } from "zod";
import { db } from "@/lib/db";
import { generateStructuredJson, generateText, AiError } from "@/lib/ai";
import { requireAuth, type AuthContext } from "@/features/auth";
import { badRequest, notFound } from "@/lib/errors";

// ==========================================
// SCHEMAS
// ==========================================

export const generateBodySchema = z.object({
  topic: z.string().min(2, "Topic must be at least 2 characters").max(1000),
  resourceType: z.enum(["quiz", "lesson_plan", "summary", "flashcards", "worksheet"]).default("quiz"),
  grade: z.string().optional().default("Grade 8"),
  subject: z.string().optional().default("General"),
  language: z.enum(["uz", "en", "ru"]).optional().default("uz"),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional().default("intermediate"),
  additionalInstructions: z.string().max(2000).optional(),
});
export type GenerateBodyInput = z.infer<typeof generateBodySchema>;

export const convertBodySchema = z.object({
  resourceId: z.string().optional(),
  content: z.string().min(10, "Content must be at least 10 characters").max(10000),
  sourceType: z.string().default("text"),
  targetType: z.enum(["quiz", "flashcards", "summary", "lesson_plan", "worksheet"]),
  language: z.enum(["uz", "en", "ru"]).optional().default("uz"),
});
export type ConvertBodyInput = z.infer<typeof convertBodySchema>;

export const editBodySchema = z.object({
  resourceId: z.string().optional(),
  currentContent: z.string().min(5, "Content is required"),
  instructions: z.string().min(3, "Edit instructions are required").max(2000),
  language: z.enum(["uz", "en", "ru"]).optional().default("uz"),
});
export type EditBodyInput = z.infer<typeof editBodySchema>;

export const createSessionBodySchema = z.object({
  title: z.string().min(1).max(200).optional(),
  currentResourceId: z.string().optional(),
  promptTemplate: z.string().optional(),
});
export type CreateSessionBodyInput = z.infer<typeof createSessionBodySchema>;

// Helper for telemetry logging
async function logAiUsage(userId: string | null, feature: string, meta: { model: string; tokensIn?: number; tokensOut?: number }) {
  if (!userId) return;
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await db.aiUsageLog.upsert({
      where: {
        userId_day_model_feature: {
          userId,
          day: today,
          model: meta.model,
          feature,
        },
      },
      update: {
        requests: { increment: 1 },
        tokensIn: { increment: meta.tokensIn || 0 },
        tokensOut: { increment: meta.tokensOut || 0 },
      },
      create: {
        userId,
        day: today,
        model: meta.model,
        feature,
        requests: 1,
        tokensIn: meta.tokensIn || 0,
        tokensOut: meta.tokensOut || 0,
      },
    });
  } catch (err) {
    console.error("[logAiUsage error]:", err);
  }
}

// ==========================================
// CORE WORKSPACE FEATURES (OPENROUTER POWERED)
// ==========================================

export async function generateResource(ctx: AuthContext, input: GenerateBodyInput) {
  const { topic, resourceType, grade, subject, language, difficulty, additionalInstructions } = input;

  const langInstruction =
    language === "uz"
      ? "MUHIM: Barcha materiallarni o'zbek tilida (lotin yozuvida) tayyorlang."
      : language === "ru"
      ? "ВАЖНО: Подготовьте все учебные материалы на русском языке."
      : "IMPORTANT: Create all educational materials in English.";

  const systemPrompt = `You are EduBek's elite AI Curriculum Architect and Educational Resource Generator.
${langInstruction}
Target Audience: ${grade}, Subject: ${subject}, Difficulty: ${difficulty}.
Always produce well-structured, rigorous, and syllabus-aligned educational content.`;

  const prompt = `Generate a comprehensive "${resourceType}" resource for the topic: "${topic}".
${additionalInstructions ? `Additional Teacher Guidance: ${additionalInstructions}\n` : ""}

Provide a valid JSON object with the following structure:
{
  "title": "Title of the resource",
  "summary": "Brief pedagogical summary",
  "resourceType": "${resourceType}",
  "subject": "${subject}",
  "grade": "${grade}",
  "content": {
    "sections": [
      {
        "heading": "Section Heading",
        "body": "Detailed content, formulas, definitions, exercises...",
        "items": ["Item 1", "Item 2"]
      }
    ],
    "exercises": [
      {
        "question": "Question or problem text",
        "answer": "Complete solution or answer",
        "explanation": "Pedagogical explanation"
      }
    ]
  },
  "tags": ["tag1", "tag2"]
}`;

  const generated = await generateStructuredJson<{
    title: string;
    summary: string;
    resourceType: string;
    subject: string;
    grade: string;
    content: any;
    tags: string[];
  }>({
    prompt,
    systemPrompt,
    maxTokens: 3500,
  });

  await logAiUsage(ctx.userId, `generate_${resourceType}`, generated.meta);

  let savedResource = null;
  if (ctx.userId) {
    try {
      savedResource = await db.resource.create({
        data: {
          ownerType: "user",
          ownerId: ctx.userId,
          resourceType,
          title: generated.data.title || `${topic} (${resourceType})`,
          description: generated.data.summary || `AI Generated ${resourceType}`,
          subject,
          grade,
          language,
          content: JSON.stringify(generated.data.content),
          metadata: JSON.stringify({
            tags: generated.data.tags || [],
            difficulty,
            model: generated.meta.model,
            generatedAt: new Date().toISOString(),
          }),
        },
      });
    } catch (dbErr) {
      console.warn("Could not persist resource to database:", dbErr);
    }
  }

  return {
    success: true,
    resource: savedResource || {
      id: "temp-" + Date.now(),
      title: generated.data.title,
      description: generated.data.summary,
      resourceType,
      subject,
      grade,
      language,
      content: generated.data.content,
      metadata: { tags: generated.data.tags, difficulty },
    },
    meta: generated.meta,
    timestamp: new Date().toISOString(),
  };
}

export async function convertResource(ctx: AuthContext, input: ConvertBodyInput) {
  const { content, targetType, language } = input;

  const langInstruction =
    language === "uz"
      ? "MUHIM: Barcha o'zgartirilgan materiallarni o'zbek tilida (lotin yozuvida) tayyorlang."
      : language === "ru"
      ? "ВАЖНО: Преобразуйте весь материал на русском языке."
      : "IMPORTANT: Convert and format all materials in English.";

  const systemPrompt = `You are EduBek AI Resource Transformer. Your job is to transform raw educational text into structured "${targetType}" formats.
${langInstruction}`;

  const prompt = `Convert the following educational text into a well-structured "${targetType}":

Source Material:
"""
${content}
"""

Return valid JSON with:
{
  "title": "Generated Resource Title",
  "targetType": "${targetType}",
  "convertedContent": {
    "summary": "Brief summary",
    "items": [
      {
        "title": "Item / Question / Card Front",
        "description": "Details / Explanation / Card Back",
        "metadata": {}
      }
    ]
  },
  "suggestedNextSteps": ["Suggestion 1", "Suggestion 2"]
}`;

  const result = await generateStructuredJson<{
    title: string;
    targetType: string;
    convertedContent: any;
    suggestedNextSteps: string[];
  }>({
    prompt,
    systemPrompt,
    maxTokens: 3000,
  });

  await logAiUsage(ctx.userId, `convert_to_${targetType}`, result.meta);

  return {
    success: true,
    data: result.data,
    meta: result.meta,
    timestamp: new Date().toISOString(),
  };
}

export async function editResource(ctx: AuthContext, input: EditBodyInput) {
  const { currentContent, instructions, language } = input;

  const langInstruction =
    language === "uz"
      ? "MUHIM: Tahrirlangan matnni o'zbek tilida (lotin yozuvida) bering."
      : language === "ru"
      ? "ВАЖНО: Предоставьте отредактированный текст на русском языке."
      : "IMPORTANT: Provide the edited text in English.";

  const systemPrompt = `You are EduBek AI Content Editor. You apply teacher instructions precisely to improve, adapt, expand, or fix educational content while preserving core pedagogical accuracy.
${langInstruction}`;

  const prompt = `Original Educational Content:
"""
${currentContent}
"""

Teacher's Modification Instructions:
"${instructions}"

Return valid JSON:
{
  "updatedContent": "Full updated and improved text / markdown...",
  "changelog": ["List of specific changes made..."],
  "improvements": ["Explanation of pedagogical improvements..."]
}`;

  const result = await generateStructuredJson<{
    updatedContent: string;
    changelog: string[];
    improvements: string[];
  }>({
    prompt,
    systemPrompt,
    maxTokens: 3500,
  });

  await logAiUsage(ctx.userId, "edit_resource", result.meta);

  return {
    success: true,
    data: result.data,
    meta: result.meta,
    timestamp: new Date().toISOString(),
  };
}

// ==========================================
// STATIC SUGGESTIONS & PROMPT TEMPLATES
// ==========================================

export function listPromptTemplates() {
  return [
    {
      id: "tpl-quiz-master",
      title: "Interactive Quiz Generator",
      category: "Assessment",
      description: "Generates multi-difficulty multiple choice questions with step-by-step diagnostic feedback.",
      prompt: "Generate a 5-question multiple choice quiz on {{topic}} for {{grade}} students.",
      tags: ["quiz", "assessment", "mcq"],
    },
    {
      id: "tpl-lesson-plan",
      title: "5E Lesson Plan Architect",
      category: "Teaching",
      description: "Creates Engage, Explore, Explain, Elaborate, Evaluate syllabus lesson structures.",
      prompt: "Create a complete 45-minute 5E lesson plan on {{topic}} including warm-up questions and formative assessments.",
      tags: ["lesson-plan", "curriculum", "5E"],
    },
    {
      id: "tpl-concept-explainer",
      title: "Socratic Concept Explainer",
      category: "Tutoring",
      description: "Explains difficult STEM or humanities concepts using intuitive analogies and worked examples.",
      prompt: "Explain {{topic}} in simple terms using everyday analogies, followed by a worked step-by-step example.",
      tags: ["tutoring", "explanation", "socratic"],
    },
    {
      id: "tpl-flashcard-set",
      title: "Active Recall Flashcards",
      category: "Study",
      description: "Extracts key definitions, formulas, and terminology into spaced repetition cards.",
      prompt: "Extract 10 key terms, formulas, and concepts from {{topic}} into high-yield flashcards.",
      tags: ["flashcards", "memorization", "recall"],
    },
    {
      id: "tpl-worksheet-gen",
      title: "Differentiated Worksheet",
      category: "Classroom",
      description: "Produces tiered practice problems from fundamental recall to Olympiad-level extensions.",
      prompt: "Generate a practice worksheet on {{topic}} with Level 1 (Fundamentals), Level 2 (Standard), and Level 3 (Challenge) problems.",
      tags: ["worksheet", "practice", "differentiation"],
    },
  ];
}

export function getSuggestions(ctx: AuthContext, resourceType?: string | null, resourceId?: string | null) {
  const suggestionsByType: Record<string, string[]> = {
    quiz: [
      "Add 3 challenging word problems with step-by-step derivations",
      "Translate all questions into Uzbek (lotin yozuvida)",
      "Add hints for each question to guide struggling students",
      "Convert this quiz into active recall flashcards",
    ],
    lesson_plan: [
      "Add a 5-minute interactive bell-ringer activity",
      "Include differentiated scaffolding for visual learners",
      "Add real-world application examples relevant to Central Asia",
      "Generate a quick exit ticket assessment",
    ],
    flashcards: [
      "Generate 5 additional reverse-recall cards",
      "Add memory mnemonics for complex formulas",
      "Format cards into a print-ready 2-column layout",
    ],
    default: [
      "Generate a formative assessment quiz on this topic",
      "Summarize the key mathematical formulas and variables",
      "Create a 45-minute structured lesson outline",
      "Explain common student misconceptions regarding this concept",
    ],
  };

  const selected = resourceType && suggestionsByType[resourceType] ? suggestionsByType[resourceType] : suggestionsByType.default;

  return selected.map((text, idx) => ({
    id: `sug-${idx + 1}`,
    text,
    resourceType: resourceType || "general",
  }));
}

// ==========================================
// SESSION MANAGEMENT (Prisma AiConversation)
// ==========================================

export async function createSession(ctx: AuthContext, input: CreateSessionBodyInput) {
  requireAuth(ctx);

  const title = input.title || "AI Workspace Session";

  const conversation = await db.aiConversation.create({
    data: {
      userId: ctx.userId,
      title,
      metadata: JSON.stringify({
        promptTemplate: input.promptTemplate || null,
        currentResourceId: input.currentResourceId || null,
        createdAt: new Date().toISOString(),
      }),
    },
  });

  return {
    id: conversation.id,
    title: conversation.title,
    createdAt: conversation.createdAt,
    metadata: input,
  };
}

export async function getSessions(ctx: AuthContext) {
  if (!ctx.isAuthenticated || !ctx.userId) {
    return [];
  }

  const conversations = await db.aiConversation.findMany({
    where: {
      userId: ctx.userId,
      isArchived: false,
    },
    orderBy: { updatedAt: "desc" },
    take: 20,
    include: {
      messages: {
        take: 1,
        orderBy: { createdAt: "desc" },
      },
    },
  });

  return conversations.map((c) => ({
    id: c.id,
    title: c.title || "Untitled Session",
    lastMessage: c.messages[0]?.content || null,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  }));
}

export async function getSession(ctx: AuthContext, sessionId: string) {
  requireAuth(ctx);

  const conversation = await db.aiConversation.findUnique({
    where: { id: sessionId },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!conversation || conversation.userId !== ctx.userId) {
    throw notFound("Session not found");
  }

  return {
    id: conversation.id,
    title: conversation.title,
    messages: conversation.messages.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      createdAt: m.createdAt,
      tokensIn: m.tokensIn,
      tokensOut: m.tokensOut,
    })),
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
  };
}

export async function getGenerationHistory(ctx: AuthContext, limit = 20) {
  if (!ctx.isAuthenticated || !ctx.userId) {
    return [];
  }

  const logs = await db.aiUsageLog.findMany({
    where: { userId: ctx.userId },
    orderBy: { day: "desc" },
    take: limit,
  });

  return logs.map((log) => ({
    id: log.id,
    feature: log.feature,
    model: log.model,
    requests: log.requests,
    tokensTotal: (log.tokensIn || 0) + (log.tokensOut || 0),
    day: log.day,
  }));
}
