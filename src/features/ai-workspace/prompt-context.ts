/**
 * EduBek — Locale-aware AI Prompt Context.
 *
 * Phase 4E.4: Every AI request now receives locale context automatically.
 * The prompt builder wraps the existing system prompts with locale-specific
 * instructions (language name, educational terminology, writing conventions)
 * without modifying the underlying prompt engineering philosophy.
 *
 * Locale resolution order:
 *   1. AuthContext.locale (from JWT — set at login, updated on language switch)
 *   2. Accept-Language header (handled by middleware)
 *   3. Default locale ("en")
 *
 * Usage:
 *   const promptCtx = buildPromptContext(ctx);
 *   const { systemPrompt, userPrompt } = renderTemplate("generate_quiz", vars, promptCtx);
 */
import type { AuthContext } from "@/features/rbac";
import { defaultLocale } from "@/i18n/routing";

// ---------------------------------------------------------------------------
// PromptContext — locale-aware wrapper for AI prompts
// ---------------------------------------------------------------------------

export interface PromptContext {
  /** Resolved locale (e.g. "en", "uz", "ru"). */
  locale: string;
  /** Human-readable language name for the LLM (e.g. "English", "Uzbek", "Russian"). */
  languageName: string;
  /** Language code for the LLM output (e.g. "en", "uz", "ru"). */
  languageCode: string;
  /** Educational terminology conventions for this locale. */
  educationalTerminology: string;
  /** Grading style convention. */
  gradingStyle: string;
  /** Quotation style for this locale. */
  quotationStyle: string;
  /** Spelling convention. */
  spellingConvention: string;
  /** Writing system (latin/cyrillic). */
  writingSystem: string;
}

// ---------------------------------------------------------------------------
// Locale metadata registry
// ---------------------------------------------------------------------------

interface LocaleMeta {
  languageName: string;
  languageCode: string;
  educationalTerminology: string;
  gradingStyle: string;
  quotationStyle: string;
  spellingConvention: string;
  writingSystem: string;
}

const LOCALE_METADATA: Record<string, LocaleMeta> = {
  en: {
    languageName: "English",
    languageCode: "en",
    educationalTerminology: "Use standard English educational terminology (e.g., 'quiz', 'worksheet', 'lesson plan', 'flashcards').",
    gradingStyle: "Use standard A-F grading scale or 0-100 percentage.",
    quotationStyle: "Use straight double quotes (\") for quotations.",
    spellingConvention: "Use American English spelling.",
    writingSystem: "Latin",
  },
  uz: {
    languageName: "Uzbek",
    languageCode: "uz",
    educationalTerminology: "Use Uzbek educational terminology (e.g., 'test', 'ish varaqi', 'sabaq rejasi', 'flashkartalar'). Keep technical terms like 'quiz', 'AI' in English where commonly used.",
    gradingStyle: "Use 5-point grading scale (1-5) or 0-100 percentage.",
    quotationStyle: "Use «» (guillemets) for quotations.",
    spellingConvention: "Use Latin-script Uzbek (O'zbek alifbosi).",
    writingSystem: "Latin",
  },
  ru: {
    languageName: "Russian",
    languageCode: "ru",
    educationalTerminology: "Use Russian educational terminology (e.g., 'тест', 'рабочий лист', 'план урока', 'карточки'). Keep technical terms like 'AI', 'PIN' in English.",
    gradingStyle: "Use 5-point grading scale (1-5) or 0-100 percentage.",
    quotationStyle: "Use «» (ёлочки) for quotations.",
    spellingConvention: "Use standard Russian spelling.",
    writingSystem: "Cyrillic",
  },
};

const DEFAULT_LOCALE_META: LocaleMeta = LOCALE_METADATA[defaultLocale]!;

// ---------------------------------------------------------------------------
// Build prompt context from AuthContext
// ---------------------------------------------------------------------------

export function buildPromptContext(ctx: AuthContext): PromptContext {
  const locale = ctx.locale ?? defaultLocale;
  const meta = LOCALE_METADATA[locale] ?? DEFAULT_LOCALE_META;
  return {
    locale,
    languageName: meta.languageName,
    languageCode: meta.languageCode,
    educationalTerminology: meta.educationalTerminology,
    gradingStyle: meta.gradingStyle,
    quotationStyle: meta.quotationStyle,
    spellingConvention: meta.spellingConvention,
    writingSystem: meta.writingSystem,
  };
}

// ---------------------------------------------------------------------------
// Locale-aware prompt wrapper
// ---------------------------------------------------------------------------

/**
 * Wrap a system prompt with locale-specific instructions.
 * The wrapper adds language + terminology + conventions guidance
 * WITHOUT modifying the underlying prompt engineering philosophy.
 *
 * The existing system prompt is preserved verbatim — we only prepend
 * locale context.
 */
export function wrapSystemPrompt(baseSystemPrompt: string, promptCtx: PromptContext): string {
  const localeBlock = `Language: ${promptCtx.languageName} (${promptCtx.languageCode}).
${promptCtx.educationalTerminology}
${promptCtx.gradingStyle}
${promptCtx.quotationStyle}
${promptCtx.spellingConvention}
Writing system: ${promptCtx.writingSystem}.

IMPORTANT: All generated content (titles, descriptions, questions, explanations) must be in ${promptCtx.languageName}. Technical terms like "JSON", "AI", "PIN" may remain in English.`;

  return `${localeBlock}\n\n${baseSystemPrompt}`;
}

/**
 * Resolve the effective language code for AI variable substitution.
 * Replaces the old hardcoded `language: 'en'` default with the user's
 * preferred locale.
 */
export function resolveLanguage(ctx: AuthContext, fallback?: string): string {
  return ctx.locale ?? fallback ?? defaultLocale;
}
