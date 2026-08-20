export { createSession, getSessions, getSession, generateResource, editResource, convertResource, getSuggestions, listPromptTemplates, getGenerationHistory } from './ai-workspace.service'
export type { AiSessionDto, GenerateResultDto, AiSuggestionDto, AiMessageDto } from './ai-workspace.types'
export { createSessionBodySchema, generateBodySchema, editBodySchema, convertBodySchema } from './ai-workspace.schema'
// Phase 4E.4: locale-aware prompt context
export { buildPromptContext, resolveLanguage, wrapSystemPrompt, type PromptContext } from './prompt-context'
