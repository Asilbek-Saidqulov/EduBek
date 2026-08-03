/**
 * POST /api/resources/[id]/translations/[language]/ai-translate
 *
 * AI-translate a resource into the specified language.
 * Uses the existing AI infrastructure to generate a translated version
 * of the resource content.
 */
import { NextResponse } from "next/server";
import { withErrorHandler, type RouteContext } from "@/lib/errors";
import { getAuthContext } from "@/features/auth";
import { createAiTranslation } from "@/features/content-translation";
import { buildPromptContext, resolveLanguage } from "@/features/ai-workspace/prompt-context";
import { generate as aiGenerate } from "@/infra/ai-providers";
import { canUseFeature, consumeUsage } from "@/features/subscription/service";
import { forbidden, unauthorized } from "@/lib/errors";
import { db } from "@/lib/db";
import { z } from "zod";

export const POST = withErrorHandler<{ id: string; language: string }>(
  async (_req, ctx: RouteContext<{ id: string; language: string }>) => {
    const authCtx = await getAuthContext();
    const { id, language } = await ctx.params;

    if (!authCtx.userId) throw unauthorized("Authentication required");

    // Check AI usage quota
    const gate = await canUseFeature(authCtx, "ai_generate");
    if (!gate.allowed) {
      throw forbidden(gate.reason ?? "AI generation quota reached", "backend.ai.errors.rateLimit");
    }

    // Fetch the resource
    const resource = await db.resource.findUnique({
      where: { id },
      select: { id: true, ownerId: true, title: true, description: true, content: true, language: true },
    });
    if (!resource) throw new Error("Resource not found");
    if (resource.ownerId !== authCtx.userId && !authCtx.isSuperadmin) {
      throw forbidden("Only the resource owner can AI-translate");
    }
    if (resource.language === language) {
      throw new Error("Cannot translate to the same language as the original");
    }

    // Build locale-aware prompt
    const promptCtx = buildPromptContext(authCtx);
    const systemPrompt = `You are an expert educational content translator. Translate the following educational content from ${resource.language} to ${language}. 
Preserve all structure, formatting, and educational meaning. Translate titles, descriptions, questions, answers, and explanations.
Return ONLY valid JSON with the same structure as the input.

${promptCtx.educationalTerminology}
${promptCtx.quotationStyle}
${promptCtx.spellingConvention}`;

    const userPrompt = `Translate this educational content to ${language}:

Title: ${resource.title}
Description: ${resource.description ?? ""}
Content: ${resource.content}

Return JSON with: { "title": "...", "description": "...", "content": "..." }`;

    // Call AI
    const aiResult = await aiGenerate({ systemPrompt, userPrompt }, "translate_resource");
    await consumeUsage(authCtx, "ai_generate", 1);

    // Parse the AI response
    let translated: { title: string; description?: string; content: string };
    try {
      const cleaned = aiResult.content.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
      translated = JSON.parse(cleaned);
    } catch {
      // Fallback: use the raw content
      translated = {
        title: resource.title,
        description: resource.description ?? undefined,
        content: aiResult.content,
      };
    }

    // Persist the translation
    const translation = await createAiTranslation(authCtx, id, language, {
      title: translated.title,
      description: translated.description,
      content: translated.content,
    });

    return NextResponse.json(translation, { status: 201 });
  },
);
