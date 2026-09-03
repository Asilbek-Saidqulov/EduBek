import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db as prisma } from "@/lib/db";
import { getAuthContext } from "@/features/auth";
import {
  chatCompletion,
  getTutorModel,
  type OpenRouterToolDeclaration,
  type ChatMessage,
} from "@/lib/ai";
import {
  BlackboardDocument,
  applySingleToolCall,
} from "@/lib/tutor/blackboard-state";
import {
  SetTitleInputSchema,
  AddSectionInputSchema,
  UpdateSectionInputSchema,
  DeleteSectionInputSchema,
  HighlightSectionInputSchema,
  InsertDiagramInputSchema,
  AddCheckpointInputSchema,
  GetContextInputSchema,
  SaveLessonInputSchema,
} from "@/lib/tutor/tools-schema";
import {
  getStudentMemory,
  formatStudentMemoryForPrompt,
  extractAndPersistConversationMemories,
} from "@/lib/tutor/student-memory";

// 1. Request Payload Schema
const TutorSessionRequestSchema = z.object({
  message: z.string().min(1).max(5000),
  conversationId: z.string().optional(),
  locale: z.enum(["uz", "en", "ru"]).default("uz"),
  document: z
    .object({
      id: z.string(),
      title: z.string(),
      subject: z.string().optional(),
      topic: z.string().optional(),
      sections: z.array(z.any()),
      updatedAt: z.string(),
    })
    .optional(),
  studentContext: z
    .object({
      subject: z.string().optional(),
      topic: z.string().optional(),
      difficulty: z.string().optional(),
      mistakeContext: z
        .object({
          questionText: z.string(),
          userAnswer: z.string(),
          correctAnswer: z.string(),
          explanation: z.string(),
        })
        .optional(),
    })
    .optional(),
});

// 2. OpenRouter Tool Declarations for Living Blackboard
const tutorOpenRouterTools: OpenRouterToolDeclaration[] = [
  {
    type: "function",
    function: {
      name: "set_title",
      description: "Set or update the title, subject, and topic of the lesson document on the blackboard.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "The clear, educational title of the lesson document." },
          subject: { type: "string", description: "Subject area, e.g., 'Physics', 'Mathematics', 'Computer Science'." },
          topic: { type: "string", description: "Specific curriculum topic, e.g., 'Kinematics', 'Quadratic Equations'." },
        },
        required: ["title"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "add_section",
      description: "Add a structured pedagogical section to the blackboard.",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string", description: "Optional unique section identifier." },
          type: {
            type: "string",
            enum: ["concept", "explanation", "derivation", "example", "diagram", "checkpoint", "summary"],
            description: "Pedagogical category of this section.",
          },
          title: { type: "string", description: "Clear heading for the section." },
          content: {
            type: "string",
            description: "Formatted content in standard Markdown with LaTeX mathematics ($inline$ or $$block$$).",
          },
          highlighted: { type: "boolean", description: "Set to true if this is currently the active focus of discussion." },
        },
        required: ["type", "title", "content"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_section",
      description: "Update or edit an existing section on the blackboard by its section ID.",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string", description: "The ID of the existing section to modify." },
          title: { type: "string", description: "Updated heading if changing." },
          content: { type: "string", description: "Updated Markdown and LaTeX content." },
          type: {
            type: "string",
            enum: ["concept", "explanation", "derivation", "example", "diagram", "checkpoint", "summary"],
          },
          highlighted: { type: "boolean" },
        },
        required: ["id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "highlight_section",
      description: "Visually highlight or unhighlight an existing section to direct student attention.",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string", description: "ID of the section to highlight or unhighlight." },
          highlighted: { type: "boolean", description: "true to highlight as active step, false to unhighlight." },
        },
        required: ["id", "highlighted"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_section",
      description: "Delete an existing section from the blackboard by its ID.",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string", description: "ID of the section to delete from the blackboard." },
        },
        required: ["id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "insert_diagram",
      description: "Insert an educational visual diagram (geometry, graphs, circuits, flowcharts) into the blackboard.",
      parameters: {
        type: "object",
        properties: {
          sectionId: { type: "string" },
          title: { type: "string", description: "Descriptive title for the diagram or chart." },
          diagramType: {
            type: "string",
            enum: ["coordinate_graph", "flowchart", "geometry", "circuit", "hierarchy", "custom_svg"],
          },
          svg: { type: "string", description: "Clean, valid SVG code with viewBox." },
          caption: { type: "string", description: "Optional caption." },
        },
        required: ["title", "diagramType", "svg"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "add_checkpoint",
      description: "Add an interactive multiple-choice diagnostic checkpoint to test student understanding.",
      parameters: {
        type: "object",
        properties: {
          checkpointId: { type: "string" },
          title: { type: "string" },
          question: { type: "string", description: "Clear multiple choice question testing the concept just covered." },
          options: { type: "array", items: { type: "string" }, description: "Array of 2-4 possible answer choices." },
          correctIndex: { type: "integer", description: "0-based index of the correct answer option." },
          explanation: { type: "string", description: "Pedagogical explanation of why the correct option is right." },
        },
        required: ["question", "options", "correctIndex", "explanation"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_context",
      description: "Retrieve student learning context, past quiz mistakes, and notes.",
      parameters: {
        type: "object",
        properties: {
          topic: { type: "string" },
          includeQuizMistakes: { type: "boolean" },
          includeProfile: { type: "boolean" },
          includeResources: { type: "boolean" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "save_lesson",
      description: "Save the current blackboard document as a reusable educational resource in the student's library.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
          visibility: { type: "string", enum: ["private", "org", "public"] },
        },
      },
    },
  },
];

// 3. Pedagogical System Instruction Builder with Student Memory
function buildTutorSystemInstruction(
  locale: string,
  studentMemoryBlock?: string
): string {
  const langRules: Record<string, string> = {
    uz: "Gapirish va doska — lotin o'zbekcha. Kirill ishlatma. Tarjima qilma, shu tilda o'rgat.",
    en: "Speak and write the board in English.",
    ru: "Говори и пиши на доске по-русски.",
  };

  return `You are a human tutor on EduBek. ${langRules[locale] || langRules.en}
Talk like a teacher in the room. Never say "the student asked" or narrate the request.

First turn only: set_title + add_section(concept) + add_section(explanation) + one short add_section(example).
No derivation, diagram, checkpoint, or summary unless the student asks.
Keep spoken reply to 2-4 short sentences. Put detail on the board.

Math: $inline$ or $$block$$.
If unsure: say so, and add a board note to check the textbook/teacher.
If this is a quiz-mistake repair: teach only the missed idea, then one tiny check question in chat (not a new essay).

${studentMemoryBlock ? studentMemoryBlock + "\n" : ""}`;
}

// 4. Server Tool Execution Handler
async function executeServerTool(
  toolName: string,
  args: Record<string, any>,
  currentDoc: BlackboardDocument,
  userId: string | null,
  locale: string,
  studentContext?: any
): Promise<{ result: any; updatedDoc: BlackboardDocument; clientMutation?: any }> {
  let updatedDoc = currentDoc;
  const normalizedTool = toolName.replace(/([A-Z])/g, "_$1").toLowerCase();
  let clientMutation: any = { tool: normalizedTool, args };

  switch (normalizedTool) {
    case "get_context": {
      const parsed = GetContextInputSchema.safeParse(args);
      const queryTopic = (parsed.success ? parsed.data.topic : args.topic) || studentContext?.topic;

      let quizMistakes: any[] = [];
      let savedNotes: any[] = [];
      let studentProfile: any = {
        name: "Student",
        locale,
        targetTopic: queryTopic || "General Studies",
      };

      if (userId) {
        try {
          if (args.includeQuizMistakes !== false) {
            const recentAttempts = await prisma.quizAttempt.findMany({
              where: { userId },
              orderBy: { startedAt: "desc" },
              take: 3,
              select: {
                score: true,
                maxScore: true,
                quiz: { select: { title: true } },
              },
            });
            quizMistakes = recentAttempts.map((a) => ({
              quizTitle: a.quiz?.title || "Quiz",
              score: a.score,
              maxScore: a.maxScore,
            }));
          }

          if (args.includeResources) {
            savedNotes = await prisma.resource.findMany({
              where: { ownerId: userId, ownerType: "user" },
              orderBy: { updatedAt: "desc" },
              take: 3,
              select: { id: true, title: true, resourceType: true, subject: true },
            });
          }

          const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { name: true, locale: true },
          });
          if (user) {
            studentProfile = { ...studentProfile, ...user };
          }
        } catch (dbErr) {
          console.warn("[Tutor get_context DB query error]", dbErr);
        }
      }

      if (studentContext?.mistakeContext) {
        quizMistakes.unshift(studentContext.mistakeContext);
      }

      return {
        result: {
          success: true,
          studentProfile,
          targetTopic: queryTopic,
          recentMistakes: quizMistakes.slice(0, 3),
          relevantNotesCount: savedNotes.length,
        },
        updatedDoc,
        clientMutation: null,
      };
    }

    case "set_title": {
      const parsed = SetTitleInputSchema.parse(args);
      updatedDoc = applySingleToolCall(updatedDoc, "set_title", parsed);
      return {
        result: { success: true, title: updatedDoc.title },
        updatedDoc,
        clientMutation: { tool: "set_title", args: parsed },
      };
    }

    case "add_section": {
      const parsed = AddSectionInputSchema.parse(args);
      updatedDoc = applySingleToolCall(updatedDoc, "add_section", parsed);
      return {
        result: {
          success: true,
          sectionId: parsed.id || updatedDoc.sections[updatedDoc.sections.length - 1]?.id,
        },
        updatedDoc,
        clientMutation: { tool: "add_section", args: parsed },
      };
    }

    case "update_section": {
      const parsed = UpdateSectionInputSchema.parse(args);
      updatedDoc = applySingleToolCall(updatedDoc, "update_section", parsed);
      return {
        result: { success: true, sectionId: parsed.id },
        updatedDoc,
        clientMutation: { tool: "update_section", args: parsed },
      };
    }

    case "highlight_section": {
      const parsed = HighlightSectionInputSchema.parse(args);
      updatedDoc = applySingleToolCall(updatedDoc, "highlight_section", parsed);
      return {
        result: { success: true, id: parsed.id, highlighted: parsed.highlighted },
        updatedDoc,
        clientMutation: { tool: "highlight_section", args: parsed },
      };
    }

    case "delete_section": {
      const parsed = DeleteSectionInputSchema.parse(args);
      updatedDoc = applySingleToolCall(updatedDoc, "delete_section", parsed);
      return {
        result: { success: true, id: parsed.id },
        updatedDoc,
        clientMutation: { tool: "delete_section", args: parsed },
      };
    }

    case "insert_diagram": {
      const parsed = InsertDiagramInputSchema.parse(args);
      updatedDoc = applySingleToolCall(updatedDoc, "insert_diagram", parsed);
      return {
        result: { success: true, diagramTitle: parsed.title },
        updatedDoc,
        clientMutation: { tool: "insert_diagram", args: parsed },
      };
    }

    case "add_checkpoint": {
      const parsed = AddCheckpointInputSchema.parse(args);
      updatedDoc = applySingleToolCall(updatedDoc, "add_checkpoint", parsed);
      return {
        result: {
          success: true,
          checkpointId: parsed.checkpointId || updatedDoc.sections[updatedDoc.sections.length - 1]?.id,
        },
        updatedDoc,
        clientMutation: { tool: "add_checkpoint", args: parsed },
      };
    }

    case "save_lesson": {
      const parsed = SaveLessonInputSchema.parse(args);
      let resourceId = "local_snapshot";

      if (userId) {
        try {
          const res = await prisma.resource.create({
            data: {
              title: parsed.title || updatedDoc.title || "Tutor Lesson Notes",
              ownerId: userId,
              ownerType: "user",
              resourceType: "note",
              subject: updatedDoc.subject || studentContext?.subject || "General",
              visibility: parsed.visibility || "private",
              content: JSON.stringify(updatedDoc),
            },
          });
          resourceId = res.id;
        } catch (saveErr) {
          console.warn("[Tutor save_lesson DB error]", saveErr);
        }
      }

      return {
        result: { success: true, resourceId, title: parsed.title || updatedDoc.title },
        updatedDoc,
        clientMutation: null,
      };
    }

    default: {
      console.warn(`[Tutor] Unknown tool invoked: ${toolName}`);
      return {
        result: { success: false, error: `Tool ${toolName} not supported` },
        updatedDoc,
        clientMutation: null,
      };
    }
  }
}

// 5. POST /api/tutor/session
export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    const rawBody = await req.json();
    const parseResult = TutorSessionRequestSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request schema for AI Tutor session.",
          issues: parseResult.error.issues,
        },
        { status: 400 }
      );
    }

    const {
      message,
      conversationId: passedConvId,
      locale,
      document: initialDoc,
      studentContext,
    } = parseResult.data;

    const authContext = await getAuthContext().catch(() => null);
    const userId = authContext?.userId || null;

    let workingDoc: BlackboardDocument = initialDoc || {
      id: "doc_default",
      title: studentContext?.topic ? `${studentContext.topic} - Lesson` : "Interactive Lesson",
      subject: studentContext?.subject,
      topic: studentContext?.topic,
      sections: [],
      updatedAt: new Date().toISOString(),
    };

    // 1. Fetch Persistent Student Memory
    let studentMemoryBlock = "";
    if (userId) {
      try {
        const studentMemory = await getStudentMemory(userId, studentContext?.topic);
        studentMemoryBlock = formatStudentMemoryForPrompt(studentMemory, locale);
      } catch (memErr) {
        console.warn("[Tutor session student memory error]", memErr);
      }
    }

    // 2. Fetch or create Conversation record in Database
    let activeConversationId = passedConvId;
    let historyMessages: ChatMessage[] = [];

    if (userId && activeConversationId) {
      const existingConv = await prisma.aiConversation.findFirst({
        where: { id: activeConversationId, userId },
        include: {
          messages: {
            orderBy: { createdAt: "asc" },
            take: 12,
          },
        },
      });

      if (existingConv) {
        historyMessages = existingConv.messages.map((m) => ({
          role: m.role === "user" ? ("user" as const) : ("assistant" as const),
          content: m.content,
        }));
      } else {
        activeConversationId = undefined;
      }
    }

    if (userId && !activeConversationId) {
      const newConv = await prisma.aiConversation.create({
        data: {
          userId,
          title: workingDoc.title || studentContext?.topic || "AI Tutor Lesson",
          metadata: JSON.stringify({
            model: getTutorModel(),
            locale,
            subject: studentContext?.subject,
            topic: studentContext?.topic,
            mistakeContext: studentContext?.mistakeContext,
          }),
        },
      });
      activeConversationId = newConv.id;
    }

    // Persist incoming User Message
    if (userId && activeConversationId) {
      await prisma.aiMessage.create({
        data: {
          conversationId: activeConversationId,
          role: "user",
          content: message,
        },
      });
    }

    // Build system instructions with student memory
    const systemPrompt = buildTutorSystemInstruction(locale, studentMemoryBlock);

    // Prepare Document snapshot for context grounding
    const docSummary = {
      title: workingDoc.title,
      subject: workingDoc.subject,
      topic: workingDoc.topic,
      sectionCount: workingDoc.sections.length,
      sections: workingDoc.sections.map((s) => ({
        id: s.id,
        type: s.type,
        title: s.title,
        highlighted: s.highlighted,
        contentPreview: s.content?.slice(0, 150),
      })),
    };

    const studentContextPrompt = studentContext?.mistakeContext
      ? `\nSTUDENT QUIZ REMEDIATION CONTEXT:
Question: "${studentContext.mistakeContext.questionText}"
Student answered: "${studentContext.mistakeContext.userAnswer}"
Correct answer: "${studentContext.mistakeContext.correctAnswer}"
Explanation: "${studentContext.mistakeContext.explanation}"
Help them diagnose why their answer was incorrect and build understanding from basics.\n`
      : "";

    const userPromptWithBlackboard = `${studentContextPrompt}CURRENT BLACKBOARD STATE:
${JSON.stringify(docSummary, null, 2)}

STUDENT MESSAGE:
"${message}"`;

    const chatMessages: ChatMessage[] = [
      ...historyMessages,
      {
        role: "user",
        content: userPromptWithBlackboard,
      },
    ];

    // Call Qwen3.5-Flash with Blackboard tools via OpenRouter
    const tutorModel = getTutorModel();
    const chatResult = await chatCompletion({
      messages: chatMessages,
      systemPrompt,
      temperature: 0.3,
      model: tutorModel,
      maxTokens: 3000,
      tools: tutorOpenRouterTools,
      toolChoice: "auto",
    });

    const executedTools: Array<{ name: string; args: any; result: any }> = [];
    const clientMutations: any[] = [];
    let assistantText = chatResult.text || "";

    // Execute any tool calls returned by Qwen3.5-Flash
    if (chatResult.toolCalls && chatResult.toolCalls.length > 0) {
      for (const call of chatResult.toolCalls) {
        const fnName = call.function?.name;
        let fnArgs: any = {};
        try {
          fnArgs = typeof call.function?.arguments === "string"
            ? JSON.parse(call.function.arguments)
            : call.function?.arguments || {};
        } catch {
          fnArgs = {};
        }

        if (fnName) {
          try {
            const execResult = await executeServerTool(
              fnName,
              fnArgs,
              workingDoc,
              userId,
              locale,
              studentContext
            );

            workingDoc = execResult.updatedDoc;
            executedTools.push({
              name: fnName,
              args: fnArgs,
              result: execResult.result,
            });

            if (execResult.clientMutation) {
              clientMutations.push(execResult.clientMutation);
            }
          } catch (toolExecErr: any) {
            console.error(`[Tutor Tool Execution Error: ${fnName}]`, toolExecErr);
            executedTools.push({
              name: fnName,
              args: fnArgs,
              result: { success: false, error: toolExecErr.message },
            });
          }
        }
      }
    }

    // Default conversational message if model only called tools without text
    if (!assistantText.trim() && executedTools.length > 0) {
      assistantText =
        locale === "uz"
          ? "Doskaga kerakli ma'lumotlarni yozdim. Ko'rib chiqing va savollaringiz bo'lsa, birgalikda tahlil qilamiz!"
          : locale === "ru"
          ? "Я записал соответствующую информацию на доске. Ознакомьтесь!"
          : "I have updated the blackboard with these concepts. Take a look!";
    }

    const durationMs = Date.now() - startTime;
    const promptTokens = chatResult.meta.tokensIn || 0;
    const candidatesTokens = chatResult.meta.tokensOut || 0;
    const totalTokens = promptTokens + candidatesTokens;
    const costUsd = (promptTokens * 0.065 + candidatesTokens * 0.26) / 1_000_000;

    // Usage metering & cost governor logging
    if (userId) {
      try {
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);

        await prisma.aiUsageLog.upsert({
          where: {
            userId_day_model_feature: {
              userId,
              day: today,
              model: chatResult.meta.model,
              feature: "ai_tutor_blackboard",
            },
          },
          create: {
            userId,
            day: today,
            model: chatResult.meta.model,
            feature: "ai_tutor_blackboard",
            requests: 1,
            tokensIn: promptTokens,
            tokensOut: candidatesTokens,
            costUsd,
          },
          update: {
            requests: { increment: 1 },
            tokensIn: { increment: promptTokens },
            tokensOut: { increment: candidatesTokens },
            costUsd: { increment: costUsd },
          },
        });
      } catch (logErr) {
        console.warn("[Tutor aiUsageLog error]", logErr);
      }
    }

    // Persist Assistant Message, Tool Calls & updated Blackboard in DB
    if (userId && activeConversationId) {
      try {
        const assistantMessage = await prisma.aiMessage.create({
          data: {
            conversationId: activeConversationId,
            role: "assistant",
            content: assistantText,
            tokensIn: promptTokens,
            tokensOut: candidatesTokens,
            costUsd,
            latencyMs: durationMs,
          },
        });

        for (const tc of executedTools) {
          try {
            await prisma.aiToolCall.create({
              data: {
                messageId: assistantMessage.id,
                toolName: tc.name,
                arguments: JSON.stringify(tc.args),
                result: JSON.stringify(tc.result),
                durationMs,
                success: true,
              },
            });
          } catch (toolCallErr) {
            console.warn("[Tutor toolCall record error]", toolCallErr);
          }
        }

        await prisma.aiConversation.update({
          where: { id: activeConversationId },
          data: {
            title: workingDoc.title || studentContext?.topic || "AI Tutor Lesson",
            metadata: JSON.stringify({
              blackboard: workingDoc,
              locale,
              subject: workingDoc.subject || studentContext?.subject,
              topic: workingDoc.topic || studentContext?.topic,
              mistakeContext: studentContext?.mistakeContext,
            }),
            lastMessageAt: new Date(),
            updatedAt: new Date(),
          },
        });
      } catch (msgPersistErr) {
        console.warn("[Tutor msg persist error]", msgPersistErr);
      }

      // Asynchronously update student learning memory based on conversation
      extractAndPersistConversationMemories(
        userId,
        [...historyMessages, { role: "user", content: message }, { role: "assistant", content: assistantText }],
        workingDoc.topic || studentContext?.topic
      ).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      conversationId: activeConversationId,
      assistantText,
      blackboard: workingDoc,
      mutations: clientMutations,
      tools: executedTools,
      usage: {
        model: chatResult.meta.model,
        promptTokens,
        candidatesTokens,
        totalTokens,
        durationMs,
      },
    });
  } catch (error: any) {
    console.error("[Tutor Session Route Error]:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "An unexpected error occurred in AI Tutor.",
      },
      { status: 500 }
    );
  }
}
