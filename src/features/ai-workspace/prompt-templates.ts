/**
 * EduBek — AI Prompt Templates.
 *
 * Phase 4E.4: Templates now expose `displayNameKey`, `descriptionKey`,
 * and `categoryKey` for frontend localization. The `renderTemplate`
 * function accepts an optional `PromptContext` to wrap system prompts
 * with locale-specific instructions.
 *
 * The prompt engineering philosophy is unchanged — we only prepend
 * locale context to the system prompt.
 */
import type { PromptContext } from "./prompt-context";
import { wrapSystemPrompt } from "./prompt-context";

export interface PromptTemplate {
  name: string;
  description: string;
  resourceTypes: string[];
  systemPrompt: string;
  userTemplate: string;
  variables: string[];
  category: string;
  /** Phase 4E.4: Translation key for the display name. */
  displayNameKey?: string;
  /** Phase 4E.4: Translation key for the description. */
  descriptionKey?: string;
  /** Phase 4E.4: Translation key for the category. */
  categoryKey?: string;
}

const jsonSys = (schema: string, rules: string[]) => `You are an expert educational content creator. Return ONLY valid JSON (no markdown). Schema:\n${schema}\n\nRules:\n${rules.map(r => `- ${r}`).join('\n')}`

export const PROMPT_TEMPLATES: Record<string, PromptTemplate> = {
  generate_quiz: {
    name: 'generate_quiz',
    description: 'Generate a quiz',
    resourceTypes: ['quiz'],
    category: 'generate',
    displayNameKey: 'backend.ai.templates.generateQuiz.displayName',
    descriptionKey: 'backend.ai.templates.generateQuiz.description',
    categoryKey: 'backend.ai.templates.categories.generate',
    systemPrompt: jsonSys('{ "title": string, "description": string, "content": { "questions": [{ "question": string, "options": [string, string, string, string], "correctIndex": number, "explanation": string }] } }', ['Exactly {{count}} questions', '4 options each', 'correctIndex 0-3']),
    userTemplate: 'Generate a {{difficulty}} quiz about "{{topic}}". Subject: {{subject}}. Grade: {{grade}}. Language: {{language}}. Questions: {{count}}. Return JSON.',
    variables: ['topic', 'difficulty', 'subject', 'grade', 'language', 'count']
  },
  generate_worksheet: {
    name: 'generate_worksheet',
    description: 'Generate a worksheet',
    resourceTypes: ['worksheet'],
    category: 'generate',
    displayNameKey: 'backend.ai.templates.generateWorksheet.displayName',
    descriptionKey: 'backend.ai.templates.generateWorksheet.description',
    categoryKey: 'backend.ai.templates.categories.generate',
    systemPrompt: jsonSys('{ "title": string, "description": string, "content": { "sections": [{ "title": string, "instructions": string, "items": [{ "type": string, "question": string, "answer": string }] }] } }', ['Progress from easy to hard']),
    userTemplate: 'Generate a worksheet about "{{topic}}". Subject: {{subject}}. Grade: {{grade}}. Language: {{language}}. Sections: {{count}}. Return JSON.',
    variables: ['topic', 'subject', 'grade', 'language', 'count']
  },
  generate_lesson_plan: {
    name: 'generate_lesson_plan',
    description: 'Generate a lesson plan',
    resourceTypes: ['lesson_plan'],
    category: 'generate',
    displayNameKey: 'backend.ai.templates.generateLessonPlan.displayName',
    descriptionKey: 'backend.ai.templates.generateLessonPlan.description',
    categoryKey: 'backend.ai.templates.categories.generate',
    systemPrompt: jsonSys('{ "title": string, "description": string, "content": { "objectives": [string], "materials": [string], "activities": [{ "name": string, "description": string, "duration_min": number }], "assessment": string, "homework": string } }', ['Measurable objectives']),
    userTemplate: 'Generate a lesson plan about "{{topic}}". Subject: {{subject}}. Grade: {{grade}}. Language: {{language}}. Duration: {{duration}} min. Return JSON.',
    variables: ['topic', 'subject', 'grade', 'language', 'duration']
  },
  generate_flashcards: {
    name: 'generate_flashcards',
    description: 'Generate flashcards',
    resourceTypes: ['flashcards'],
    category: 'generate',
    displayNameKey: 'backend.ai.templates.generateFlashcards.displayName',
    descriptionKey: 'backend.ai.templates.generateFlashcards.description',
    categoryKey: 'backend.ai.templates.categories.generate',
    systemPrompt: jsonSys('{ "title": string, "description": string, "content": { "cards": [{ "front": string, "back": string }] } }', ['Front = question/term', 'Back = answer/definition']),
    userTemplate: 'Generate {{count}} flashcards about "{{topic}}". Subject: {{subject}}. Grade: {{grade}}. Language: {{language}}. Return JSON.',
    variables: ['topic', 'subject', 'grade', 'language', 'count']
  },
  edit_resource: {
    name: 'edit_resource',
    description: 'Edit a resource',
    resourceTypes: ['quiz', 'worksheet', 'lesson_plan', 'flashcards', 'notes', 'exam', 'homework'],
    category: 'edit',
    displayNameKey: 'backend.ai.templates.editResource.displayName',
    descriptionKey: 'backend.ai.templates.editResource.description',
    categoryKey: 'backend.ai.templates.categories.edit',
    systemPrompt: 'You are an expert editor. Edit the resource: {{editType}}. Current content: {{content}}. Return ONLY valid JSON with the same schema. Instructions: {{instructions}}',
    userTemplate: 'Please {{editType}} this resource. Instructions: {{instructions}}. Return JSON.',
    variables: ['editType', 'content', 'instructions']
  },
  convert_resource: {
    name: 'convert_resource',
    description: 'Convert resource type',
    resourceTypes: ['quiz', 'worksheet', 'lesson_plan', 'flashcards', 'notes', 'exam', 'homework'],
    category: 'convert',
    displayNameKey: 'backend.ai.templates.convertResource.displayName',
    descriptionKey: 'backend.ai.templates.convertResource.description',
    categoryKey: 'backend.ai.templates.categories.convert',
    systemPrompt: 'Convert from {{sourceType}} to {{targetType}}. Current content: {{content}}. Return ONLY valid JSON in the target format.',
    userTemplate: 'Convert this {{sourceType}} to {{targetType}}. Return JSON.',
    variables: ['sourceType', 'targetType', 'content']
  },
}

export function getTemplate(name: string): PromptTemplate {
  const t = PROMPT_TEMPLATES[name]
  if (!t) throw new Error(`Template "${name}" not found`)
  return t
}

export function listTemplates() {
  return Object.entries(PROMPT_TEMPLATES).map(([name, t]) => ({
    name,
    description: t.description,
    category: t.category,
    resourceTypes: t.resourceTypes,
    variables: t.variables,
    displayNameKey: t.displayNameKey,
    descriptionKey: t.descriptionKey,
    categoryKey: t.categoryKey,
  }))
}

/**
 * Render a prompt template with variables.
 * Phase 4E.4: If a PromptContext is provided, the system prompt is
 * wrapped with locale-specific instructions.
 */
export function renderTemplate(name: string, vars: Record<string, string>, promptCtx?: PromptContext) {
  const t = getTemplate(name)
  let sys = t.systemPrompt, usr = t.userTemplate
  for (const [k, v] of Object.entries(vars)) {
    sys = sys.replaceAll(`{{${k}}}`, v)
    usr = usr.replaceAll(`{{${k}}}`, v)
  }
  // Phase 4E.4: wrap system prompt with locale context
  if (promptCtx) {
    sys = wrapSystemPrompt(sys, promptCtx)
  }
  return { systemPrompt: sys, userPrompt: usr }
}
