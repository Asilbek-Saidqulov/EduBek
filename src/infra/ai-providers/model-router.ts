/**
 * Infra — AI Model Router.
 *
 * Routes generation requests to the appropriate model based on task complexity.
 * This is the architecture foundation — the current implementation always uses
 * the default provider/model, but the routing logic is in place for future
 * multi-model support.
 *
 * Routing strategy (future):
 *   - Simple tasks (translate, simplify, shorten) → cheap model
 *   - Complex generation (create quiz, lesson plan) → powerful model
 *   - Long reasoning (convert format, analyze) → reasoning model
 *
 * Current: all tasks use the default provider.
 */

import { aiProviderRegistry, type AIProvider, type AiGenerateInput, type AiGenerateResult } from './index'
import { logger } from '@/lib/logger'

const log = logger.child({ module: 'ai-model-router' })

// ----------------------------------------------------------------------------
// Task complexity levels — used for routing.
// ----------------------------------------------------------------------------

export type TaskComplexity = 'simple' | 'complex' | 'reasoning'

/** Map generation types to complexity levels. */
const COMPLEXITY_MAP: Record<string, TaskComplexity> = {
  // Simple tasks — cheap model
  translate: 'simple',
  simplify: 'simple',
  shorten: 'simple',
  expand: 'simple',
  improve: 'simple',
  rewrite: 'simple',
  explain: 'simple',
  // Complex tasks — powerful model
  generate_quiz: 'complex',
  generate_worksheet: 'complex',
  generate_lesson_plan: 'complex',
  generate_homework: 'complex',
  generate_exam: 'complex',
  generate_flashcards: 'complex',
  generate_rubric: 'complex',
  generate_presentation: 'complex',
  generate_practice: 'complex',
  generate_assignment: 'complex',
  // Reasoning tasks — reasoning model
  convert: 'reasoning',
  analyze: 'reasoning',
  summarize: 'reasoning',
}

export function getTaskComplexity(generationType: string): TaskComplexity {
  return COMPLEXITY_MAP[generationType] ?? 'complex'
}

// ----------------------------------------------------------------------------
// Model Router
// ----------------------------------------------------------------------------

export interface RouteResult {
  provider: AIProvider
  model: string
  complexity: TaskComplexity
  reason: string
}

/**
 * Route a generation request to the appropriate provider + model.
 *
 * Current: always uses the default provider.
 * Future: select provider + model based on complexity.
 */
export function routeModel(generationType: string): RouteResult {
  const complexity = getTaskComplexity(generationType)
  const provider = aiProviderRegistry.default

  // Future: switch model based on complexity
  // if (complexity === 'simple') model = 'gpt-4o-mini'
  // if (complexity === 'complex') model = 'gpt-4o'
  // if (complexity === 'reasoning') model = 'o1-preview'
  const model = provider.defaultModel

  log.debug('routeModel', { generationType, complexity, provider: provider.name, model })

  return {
    provider,
    model,
    complexity,
    reason: complexity,
  }
}

/**
 * Generate using the routed model. This is the single entry point for all
 * AI generation in EduBek — services call this, never the provider directly.
 */
export async function generate(
  input: AiGenerateInput,
  generationType: string,
): Promise<AiGenerateResult & { complexity: TaskComplexity }> {
  const route = routeModel(generationType)
  const result = await route.provider.generate({ ...input, model: route.model })
  return { ...result, complexity: route.complexity }
}
