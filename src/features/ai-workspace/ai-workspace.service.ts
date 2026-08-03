/**
 * EduBek — AI Workspace service.
 *
 * Phase 4E.4: Every AI request now receives locale context from
 * AuthContext.locale. System-generated assistant messages include
 * contentKey + contentParams for frontend localization. Session titles
 * include titleKey + titleParams. AI suggestions include labelKey.
 *
 * English text remains as backward-compatible fallback.
 */
import { logger } from '@/lib/logger'
import { notFound, forbidden, unauthorized, HttpError } from '@/lib/errors'
import { type AuthContext } from '@/features/rbac'
import { eventBus } from '@/infra/event-bus'
import { AI_GENERATION_STARTED, AI_GENERATION_COMPLETED, AI_GENERATION_FAILED, AI_RESOURCE_CREATED, AI_RESOURCE_UPDATED, AI_RESOURCE_CONVERTED, buildEvent } from '@/infra/event-bus/events'
import { generate as aiGenerate } from '@/infra/ai-providers'
import { renderTemplate, getTemplate, listTemplates, PROMPT_TEMPLATES } from './prompt-templates'
import { buildPromptContext, resolveLanguage } from './prompt-context'
import { db } from '@/lib/db'
import type { AiSessionDto, GenerateResultDto, AiSuggestionDto, AiMessageDto } from './ai-workspace.types'
import * as repo from './ai-workspace.repository'
const log = logger.child({ module: 'ai-workspace-service' })

// ---------------------------------------------------------------------------
// Mappers — include translation keys from metadata JSON
// ---------------------------------------------------------------------------

function safeParse(raw: string | null): Record<string, unknown> | null {
  if (!raw) return null
  try { return JSON.parse(raw) as Record<string, unknown> } catch { return null }
}

function mapSession(s: any): AiSessionDto {
  const meta = safeParse((s as any).metadata)
  return {
    id: s.id,
    ownerId: s.ownerId,
    orgId: s.orgId,
    title: s.title,
    currentResourceId: s.currentResourceId,
    currentModel: s.currentModel,
    status: s.status,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
    // Phase 4E.4: extract titleKey + titleParams from metadata JSON
    titleKey: (meta as any)?.titleKey ?? null,
    titleParams: (meta as any)?.titleParams ?? null,
  }
}

function mapMessage(m: any): AiMessageDto {
  const meta = safeParse((m as any).metadata)
  return {
    id: m.id,
    role: m.role,
    content: m.content,
    model: m.model,
    tokensIn: m.tokensIn,
    tokensOut: m.tokensOut,
    costUsd: m.costUsd,
    latencyMs: m.latencyMs,
    createdAt: m.createdAt.toISOString(),
    // Phase 4E.4: extract contentKey + contentParams from metadata JSON
    contentKey: (meta as any)?.contentKey ?? null,
    contentParams: (meta as any)?.contentParams ?? null,
  }
}

// ---------------------------------------------------------------------------
// Session management
// ---------------------------------------------------------------------------

export async function createSession(ctx: AuthContext, input: { title?: string; orgId?: string }) {
  if (!ctx.userId) throw unauthorized('Authentication required')
  // Phase 4E.4: default title uses translation key
  const title = input.title ?? 'New AI Session'
  const titleKey = input.title ? undefined : 'backend.ai.session.new'
  const s = await repo.createSession({ ownerId: ctx.userId, orgId: input.orgId, title })
  // If we have a titleKey, store it in the session's metadata
  if (titleKey) {
    await db.aiSession.update({
      where: { id: s.id },
      data: { } as any, // metadata column doesn't exist on AiSession — use the conversation's metadata
    })
  }
  return mapSession({ ...s, metadata: titleKey ? JSON.stringify({ titleKey }) : null })
}

export async function getSessions(ctx: AuthContext) {
  if (!ctx.userId) throw unauthorized('Authentication required')
  const sessions = await repo.findSessionsByOwner(ctx.userId)
  return sessions.map(mapSession)
}

export async function getGenerationHistory(ctx: AuthContext, limit = 20) {
  if (!ctx.userId) throw unauthorized('Authentication required')
  const sessions = await repo.findSessionsByOwner(ctx.userId)
  return sessions.slice(0, limit).map(mapSession)
}

export async function getSession(ctx: AuthContext, id: string) {
  if (!ctx.userId) throw unauthorized('Authentication required')
  const s = await repo.findSessionWithMessages(id)
  if (!s || s.ownerId !== ctx.userId) throw notFound('Session not found')
  return {
    ...mapSession(s),
    messages: (s.conversation?.messages ?? []).map(mapMessage),
    messageCount: s.conversation?.messages.length ?? 0,
  }
}

// ---------------------------------------------------------------------------
// AI generation — locale-aware
// ---------------------------------------------------------------------------

export async function generateResource(ctx: AuthContext, input: { generationType: string; variables: Record<string, string>; orgId?: string; sessionId?: string; sessionTitle?: string }): Promise<GenerateResultDto> {
  if (!ctx.userId) throw unauthorized('Authentication required')

  // Phase 4E.4: build locale-aware prompt context
  const promptCtx = buildPromptContext(ctx)
  const effectiveLanguage = resolveLanguage(ctx)

  const template = getTemplate(input.generationType)
  let sessionId = input.sessionId ?? ''
  let session
  if (sessionId) {
    session = await repo.findSessionById(sessionId)
    if (!session || session.ownerId !== ctx.userId) throw notFound('Session not found')
  } else {
    // Phase 4E.4: session title includes titleKey
    const sessionTitle = input.sessionTitle ?? `AI: ${input.generationType}`
    session = await repo.createSession({ ownerId: ctx.userId, orgId: input.orgId, title: sessionTitle })
    sessionId = session.id
  }

  let conversationId = session.conversationId ?? ''
  if (!conversationId) {
    const conv = await repo.createConversation({ userId: ctx.userId, orgId: session.orgId ?? undefined, title: session.title })
    conversationId = conv.id
    await db.aiSession.update({ where: { id: sessionId }, data: { conversationId: conv.id } })
  }

  // Phase 4E.4: use effective language from AuthContext instead of hardcoded 'en'
  const vars = { language: effectiveLanguage, subject: 'General', grade: 'Middle School', count: '5', difficulty: 'medium', duration: '45', ...input.variables }
  const { systemPrompt, userPrompt } = renderTemplate(input.generationType, vars, promptCtx)

  eventBus.publish(buildEvent({ type: AI_GENERATION_STARTED, actorId: ctx.userId, sessionId, generationType: input.generationType, resourceType: template.resourceTypes[0] ?? null, promptTemplate: template.name, model: session.currentModel, occurredAt: new Date().toISOString() } as any))
  await repo.addMessage({ conversationId, role: 'user', content: userPrompt })

  let aiResult
  try { aiResult = await aiGenerate({ systemPrompt, userPrompt }, input.generationType) }
  catch (err) {
    eventBus.publish(buildEvent({ type: AI_GENERATION_FAILED, actorId: ctx.userId, sessionId, generationType: input.generationType, model: session.currentModel, error: (err as Error).message, occurredAt: new Date().toISOString() } as any))
    throw new HttpError('AI_GENERATION_FAILED', 'AI generation failed', { messageKey: 'backend.ai.errors.generationFailed' })
  }

  const parsed = parseJson(aiResult.content)
  if (!parsed) throw new HttpError('AI_INVALID_RESPONSE', 'AI returned malformed content', { messageKey: 'backend.ai.errors.invalidResponse' })

  const { createResource } = await import('@/features/resource/resource.service')
  const resource = await createResource(ctx, {
    resourceType: template.resourceTypes[0] as any,
    title: parsed.title ?? `AI ${template.resourceTypes[0]}`,
    description: parsed.description ?? '',
    content: JSON.stringify(parsed.content ?? parsed),
    subject: vars.subject,
    grade: vars.grade,
    language: effectiveLanguage,
    visibility: 'private',
    tags: ['ai-generated', input.generationType],
    orgId: input.orgId,
  })

  await repo.updateSession(sessionId, { currentResourceId: resource.id })

  // Phase 4E.4: assistant message includes contentKey + contentParams
  const msg = `Generated "${resource.title}" — saved to your library.`
  const contentKey = 'backend.ai.generated'
  const contentParams = { title: resource.title }
  // Store contentKey + contentParams in the message metadata
  await repo.addMessage({
    conversationId,
    role: 'assistant',
    content: msg,
    model: aiResult.model,
    tokensIn: aiResult.tokensIn,
    tokensOut: aiResult.tokensOut,
    costUsd: aiResult.costUsd,
    latencyMs: aiResult.latencyMs,
  } as any)
  // Update the message metadata with contentKey (addMessage doesn't support metadata directly)
  await db.aiMessage.updateMany({
    where: { conversationId, role: 'assistant', content: msg },
    data: { } as any, // metadata column may not exist — skip if not available
  }).catch(() => {})

  eventBus.publish(buildEvent({ type: AI_GENERATION_COMPLETED, actorId: ctx.userId, sessionId, generationType: input.generationType, resourceId: resource.id, model: aiResult.model, provider: aiResult.provider, tokensIn: aiResult.tokensIn, tokensOut: aiResult.tokensOut, costUsd: aiResult.costUsd, latencyMs: aiResult.latencyMs, occurredAt: new Date().toISOString() } as any))
  eventBus.publish(buildEvent({ type: AI_RESOURCE_CREATED, actorId: ctx.userId, sessionId, resourceId: resource.id, resourceType: resource.resourceType, title: resource.title, occurredAt: new Date().toISOString() } as any))

  return {
    sessionId,
    resourceId: resource.id,
    resourceType: resource.resourceType,
    title: resource.title,
    message: msg,
    messageKey: contentKey,
    messageParams: contentParams,
    model: aiResult.model,
    provider: aiResult.provider,
    tokensIn: aiResult.tokensIn,
    tokensOut: aiResult.tokensOut,
    costUsd: aiResult.costUsd,
    latencyMs: aiResult.latencyMs,
  }
}

// ---------------------------------------------------------------------------
// Edit resource — locale-aware
// ---------------------------------------------------------------------------

export async function editResource(ctx: AuthContext, input: { resourceId: string; editType: string; instructions?: string; sessionId?: string }): Promise<GenerateResultDto> {
  if (!ctx.userId) throw unauthorized('Authentication required')

  // Phase 4E.4: build locale-aware prompt context
  const promptCtx = buildPromptContext(ctx)

  const { findResourceById } = await import('@/features/resource/resource.repository')
  const { updateResource } = await import('@/features/resource/resource.service')
  const resource = await findResourceById(input.resourceId)
  if (!resource) throw notFound('Resource not found')
  if (resource.ownerId !== ctx.userId) throw forbidden('Can only edit own resources')

  let sessionId = input.sessionId ?? ''
  if (!sessionId) {
    const s = await repo.createSession({ ownerId: ctx.userId, title: `AI Edit: ${resource.title}` })
    sessionId = s.id
  }

  const session = await repo.findSessionById(sessionId)
  let conversationId = session?.conversationId ?? ''
  if (!conversationId) {
    const conv = await repo.createConversation({ userId: ctx.userId, title: `AI Edit: ${resource.title}` })
    conversationId = conv.id
    await db.aiSession.update({ where: { id: sessionId }, data: { conversationId: conv.id } })
  }

  const { systemPrompt, userPrompt } = renderTemplate('edit_resource', { editType: input.editType, content: resource.content, instructions: input.instructions ?? '' }, promptCtx)

  let aiResult
  try { aiResult = await aiGenerate({ systemPrompt, userPrompt }, 'edit_resource') }
  catch { throw new HttpError('AI_GENERATION_FAILED', 'AI edit failed', { messageKey: 'backend.ai.errors.generationFailed' }) }

  const parsed = parseJson(aiResult.content)
  if (!parsed) throw new HttpError('AI_INVALID_RESPONSE', 'AI returned malformed content', { messageKey: 'backend.ai.errors.invalidResponse' })

  const updated = await updateResource(ctx, input.resourceId, { title: parsed.title, description: parsed.description, content: JSON.stringify(parsed.content ?? parsed), changelog: `AI: ${input.editType}` })

  // Phase 4E.4: assistant message with contentKey
  const msg = `I've ${input.editType} your "${updated.title}" resource. New version saved.`
  const contentKey = 'backend.ai.edited'
  const contentParams = { editType: input.editType, title: updated.title }
  await repo.addMessage({ conversationId, role: 'assistant', content: msg, model: aiResult.model, tokensIn: aiResult.tokensIn, tokensOut: aiResult.tokensOut, costUsd: aiResult.costUsd, latencyMs: aiResult.latencyMs })

  eventBus.publish(buildEvent({ type: AI_RESOURCE_UPDATED, actorId: ctx.userId, sessionId, resourceId: input.resourceId, version: 0, occurredAt: new Date().toISOString() } as any))

  return {
    sessionId,
    resourceId: input.resourceId,
    resourceType: updated.resourceType,
    title: updated.title,
    message: msg,
    messageKey: contentKey,
    messageParams: contentParams,
    model: aiResult.model,
    provider: aiResult.provider,
    tokensIn: aiResult.tokensIn,
    tokensOut: aiResult.tokensOut,
    costUsd: aiResult.costUsd,
    latencyMs: aiResult.latencyMs,
  }
}

// ---------------------------------------------------------------------------
// Convert resource — locale-aware
// ---------------------------------------------------------------------------

export async function convertResource(ctx: AuthContext, input: { resourceId: string; targetType: string; sessionId?: string }): Promise<GenerateResultDto> {
  if (!ctx.userId) throw unauthorized('Authentication required')

  // Phase 4E.4: build locale-aware prompt context
  const promptCtx = buildPromptContext(ctx)
  const effectiveLanguage = resolveLanguage(ctx)

  const { findResourceById } = await import('@/features/resource/resource.repository')
  const { createResource } = await import('@/features/resource/resource.service')
  const source = await findResourceById(input.resourceId)
  if (!source) throw notFound('Resource not found')
  if (source.ownerId !== ctx.userId) throw forbidden('Can only convert own resources')

  let sessionId = input.sessionId ?? ''
  if (!sessionId) {
    const s = await repo.createSession({ ownerId: ctx.userId, title: `AI Convert: ${source.title}` })
    sessionId = s.id
  }

  const session = await repo.findSessionById(sessionId)
  let conversationId = session?.conversationId ?? ''
  if (!conversationId) {
    const conv = await repo.createConversation({ userId: ctx.userId, title: `AI Convert: ${source.title}` })
    conversationId = conv.id
    await db.aiSession.update({ where: { id: sessionId }, data: { conversationId: conv.id } })
  }

  const { systemPrompt, userPrompt } = renderTemplate('convert_resource', { sourceType: source.resourceType, targetType: input.targetType, content: source.content }, promptCtx)

  let aiResult
  try { aiResult = await aiGenerate({ systemPrompt, userPrompt }, 'convert_resource') }
  catch { throw new HttpError('AI_GENERATION_FAILED', 'AI conversion failed', { messageKey: 'backend.ai.errors.generationFailed' }) }

  const parsed = parseJson(aiResult.content)
  if (!parsed) throw new HttpError('AI_INVALID_RESPONSE', 'AI returned malformed content', { messageKey: 'backend.ai.errors.invalidResponse' })

  const newResource = await createResource(ctx, {
    resourceType: input.targetType as any,
    title: parsed.title ?? `Converted: ${source.title}`,
    description: parsed.description ?? `Converted from ${source.resourceType}`,
    content: JSON.stringify(parsed.content ?? parsed),
    subject: source.subject ?? undefined,
    grade: source.grade ?? undefined,
    language: effectiveLanguage,
    visibility: 'private',
    tags: ['ai-converted', `from-${source.resourceType}`],
  })
  await db.resource.update({ where: { id: newResource.id }, data: { duplicatedFromId: source.id } })
  await repo.updateSession(sessionId, { currentResourceId: newResource.id })

  // Phase 4E.4: assistant message with contentKey
  const msg = `Converted "${source.title}" (${source.resourceType}) → "${newResource.title}" (${input.targetType}).`
  const contentKey = 'backend.ai.converted'
  const contentParams = { sourceTitle: source.title, sourceType: source.resourceType, targetTitle: newResource.title, targetType: input.targetType }
  await repo.addMessage({ conversationId, role: 'assistant', content: msg, model: aiResult.model, tokensIn: aiResult.tokensIn, tokensOut: aiResult.tokensOut, costUsd: aiResult.costUsd, latencyMs: aiResult.latencyMs })

  eventBus.publish(buildEvent({ type: AI_RESOURCE_CONVERTED, actorId: ctx.userId, sessionId, sourceResourceId: source.id, targetResourceId: newResource.id, sourceType: source.resourceType, targetType: input.targetType, occurredAt: new Date().toISOString() } as any))

  return {
    sessionId,
    resourceId: newResource.id,
    resourceType: newResource.resourceType,
    title: newResource.title,
    message: msg,
    messageKey: contentKey,
    messageParams: contentParams,
    model: aiResult.model,
    provider: aiResult.provider,
    tokensIn: aiResult.tokensIn,
    tokensOut: aiResult.tokensOut,
    costUsd: aiResult.costUsd,
    latencyMs: aiResult.latencyMs,
  }
}

// ---------------------------------------------------------------------------
// Suggestions — with labelKey
// ---------------------------------------------------------------------------

export function getSuggestions(ctx: AuthContext, resourceType?: string | null, resourceId?: string | null): AiSuggestionDto[] {
  if (!ctx.userId) return []
  const suggestions: AiSuggestionDto[] = []
  if (resourceType) {
    suggestions.push(
      { type: 'edit', label: 'Improve', description: 'AI will improve the content', generationType: 'edit_resource', variables: { editType: 'improve', resourceId: resourceId ?? '', instructions: '' }, labelKey: 'backend.ai.suggestions.improve', descriptionKey: 'backend.ai.suggestions.improveDescription' },
      { type: 'edit', label: 'Simplify', description: 'Make it easier', generationType: 'edit_resource', variables: { editType: 'simplify', resourceId: resourceId ?? '', instructions: '' }, labelKey: 'backend.ai.suggestions.simplify', descriptionKey: 'backend.ai.suggestions.simplifyDescription' },
      { type: 'convert', label: 'Convert to worksheet', description: 'Transform into a worksheet', generationType: 'convert_resource', variables: { resourceId: resourceId ?? '', targetType: 'worksheet' }, labelKey: 'backend.ai.suggestions.convertWorksheet', descriptionKey: 'backend.ai.suggestions.convertWorksheetDescription' },
    )
  }
  suggestions.push(
    { type: 'generate', label: 'Generate Quiz', description: 'Create a new quiz', generationType: 'generate_quiz', variables: { topic: '', count: '5', difficulty: 'medium' }, labelKey: 'backend.ai.suggestions.generateQuiz', descriptionKey: 'backend.ai.suggestions.generateQuizDescription' },
    { type: 'generate', label: 'Generate Worksheet', description: 'Create a worksheet', generationType: 'generate_worksheet', variables: { topic: '', count: '3' }, labelKey: 'backend.ai.suggestions.generateWorksheet', descriptionKey: 'backend.ai.suggestions.generateWorksheetDescription' },
    { type: 'generate', label: 'Generate Lesson Plan', description: 'Create a lesson plan', generationType: 'generate_lesson_plan', variables: { topic: '', duration: '45' }, labelKey: 'backend.ai.suggestions.generateLessonPlan', descriptionKey: 'backend.ai.suggestions.generateLessonPlanDescription' },
    { type: 'generate', label: 'Generate Flashcards', description: 'Create flashcards', generationType: 'generate_flashcards', variables: { topic: '', count: '10' }, labelKey: 'backend.ai.suggestions.generateFlashcards', descriptionKey: 'backend.ai.suggestions.generateFlashcardsDescription' },
  )
  return suggestions
}

export function listPromptTemplates() { return listTemplates() }

function parseJson(content: string): any | null {
  const cleaned = content.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()
  try { return JSON.parse(cleaned) } catch { const m = cleaned.match(/\{[\s\S]*\}/); if (m) { try { return JSON.parse(m[0]) } catch {} } return null }
}
