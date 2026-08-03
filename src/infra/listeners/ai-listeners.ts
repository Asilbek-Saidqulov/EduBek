/** AI Workspace event listeners — audit logging for all AI events. */

import { auditLogger } from '@/infra/audit'
import { eventBus } from '@/infra/event-bus'
import { logger } from '@/lib/logger'
import {
  AI_GENERATION_STARTED, AI_GENERATION_COMPLETED, AI_GENERATION_FAILED,
  AI_RESOURCE_CREATED, AI_RESOURCE_UPDATED, AI_RESOURCE_CONVERTED,
  PROMPT_TEMPLATE_USED, AI_PROVIDER_SELECTED,
  type AiGenerationStartedEvent, type AiGenerationCompletedEvent, type AiGenerationFailedEvent,
  type AiResourceCreatedEvent, type AiResourceUpdatedEvent, type AiResourceConvertedEvent,
  type PromptTemplateUsedEvent, type AiProviderSelectedEvent,
} from '@/infra/event-bus/events'

const log = logger.child({ module: 'ai-listeners' })

export function registerAiListeners(): void {
  log.info('registering AI listeners')

  eventBus.subscribe<AiGenerationStartedEvent>(AI_GENERATION_STARTED, (e) =>
    auditLogger.log({ action: 'ai.generation_started', actorId: e.actorId, entityType: 'ai_session', entityId: e.sessionId, metadata: { generationType: e.generationType, model: e.model, promptTemplate: e.promptTemplate } })
  )

  eventBus.subscribe<AiGenerationCompletedEvent>(AI_GENERATION_COMPLETED, (e) =>
    auditLogger.log({ action: 'ai.generation_completed', actorId: e.actorId, entityType: 'resource', entityId: e.resourceId ?? undefined, metadata: { sessionId: e.sessionId, generationType: e.generationType, model: e.model, provider: e.provider, tokensIn: e.tokensIn, tokensOut: e.tokensOut, costUsd: e.costUsd, latencyMs: e.latencyMs } })
  )

  eventBus.subscribe<AiGenerationFailedEvent>(AI_GENERATION_FAILED, (e) =>
    auditLogger.log({ action: 'ai.generation_failed', actorId: e.actorId, entityType: 'ai_session', entityId: e.sessionId, status: 'failure', metadata: { generationType: e.generationType, model: e.model, error: e.error } })
  )

  eventBus.subscribe<AiResourceCreatedEvent>(AI_RESOURCE_CREATED, (e) =>
    auditLogger.log({ action: 'ai.resource_created', actorId: e.actorId, entityType: 'resource', entityId: e.resourceId, metadata: { sessionId: e.sessionId, resourceType: e.resourceType, title: e.title } })
  )

  eventBus.subscribe<AiResourceUpdatedEvent>(AI_RESOURCE_UPDATED, (e) =>
    auditLogger.log({ action: 'ai.resource_updated', actorId: e.actorId, entityType: 'resource', entityId: e.resourceId, metadata: { sessionId: e.sessionId, version: e.version } })
  )

  eventBus.subscribe<AiResourceConvertedEvent>(AI_RESOURCE_CONVERTED, (e) =>
    auditLogger.log({ action: 'ai.resource_converted', actorId: e.actorId, entityType: 'resource', entityId: e.targetResourceId, metadata: { sessionId: e.sessionId, sourceResourceId: e.sourceResourceId, sourceType: e.sourceType, targetType: e.targetType } })
  )

  eventBus.subscribe<PromptTemplateUsedEvent>(PROMPT_TEMPLATE_USED, (e) =>
    auditLogger.log({ action: 'ai.prompt_template_used', actorId: e.actorId, entityType: 'ai_session', entityId: e.sessionId, metadata: { templateName: e.templateName, model: e.model } })
  )

  eventBus.subscribe<AiProviderSelectedEvent>(AI_PROVIDER_SELECTED, (e) =>
    auditLogger.log({ action: 'ai.provider_selected', actorId: e.actorId, entityType: 'ai_session', entityId: e.sessionId, metadata: { provider: e.provider, model: e.model, reason: e.reason } })
  )
}
