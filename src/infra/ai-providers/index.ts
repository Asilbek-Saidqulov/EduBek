/**
 * EduBek — AI Provider Registry.
 *
 * Uses OpenRouter (https://openrouter.ai) as the AI gateway.
 *
 * The model is configured via the OPENROUTER_MODEL environment variable.
 * Defaults to "google/gemini-3.7-flash" if not set.
 *
 * You can switch to any model OpenRouter supports by changing OPENROUTER_MODEL:
 *   OPENROUTER_MODEL=google/gemini-3.7-flash
 *   OPENROUTER_MODEL=anthropic/claude-3.5-sonnet
 *   OPENROUTER_MODEL=openai/gpt-4o
 *   OPENROUTER_MODEL=meta-llama/llama-3.3-70b-instruct
 *
 * Other AI providers (added via the registry) also read their model from env:
 *   - OPENAI_API_KEY + OPENAI_MODEL
 *   - ANTHROPIC_API_KEY + ANTHROPIC_MODEL
 *   - GOOGLE_AI_KEY + GOOGLE_AI_MODEL
 *
 * Set OPENROUTER_API_KEY in your environment to enable AI features.
 */
import { logger } from '@/lib/logger'
const log = logger.child({ module: 'ai-providers' })

export interface AiGenerateInput {
  systemPrompt: string
  userPrompt: string
  model?: string
  temperature?: number
  maxTokens?: number
}
export interface AiGenerateResult {
  content: string
  model: string
  provider: string
  tokensIn: number
  tokensOut: number
  costUsd: number
  latencyMs: number
  finishReason: string | null
}
export interface AIProvider {
  readonly name: string
  readonly defaultModel: string
  generate(input: AiGenerateInput): Promise<AiGenerateResult>
}

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1/chat/completions'

// ---------------------------------------------------------------------------
// OpenRouter Provider — model configurable via OPENROUTER_MODEL env var
// ---------------------------------------------------------------------------

export class OpenRouterProvider implements AIProvider {
  readonly name = 'openrouter'

  /** Model is read from OPENROUTER_MODEL env var; defaults to Gemini 3.7 Flash. */
  get defaultModel(): string {
    return process.env.OPENROUTER_MODEL || 'google/gemini-3.7-flash'
  }

  async generate(input: AiGenerateInput): Promise<AiGenerateResult> {
    const start = Date.now()
    const apiKey = process.env.OPENROUTER_API_KEY

    if (!apiKey) {
      throw new Error(
        'OPENROUTER_API_KEY is not set. AI features require an OpenRouter API key. ' +
        'Get one at https://openrouter.ai/keys and set OPENROUTER_API_KEY in your .env file.'
      )
    }

    // Model resolution order: input.model > OPENROUTER_MODEL env > default
    const model = input.model || this.defaultModel
    const temperature = input.temperature ?? 0.7
    const maxTokens = input.maxTokens ?? 4096

    log.info('ai.generate.start', { model, provider: this.name })

    const response = await fetch(OPENROUTER_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': process.env.OPENROUTER_REFERER || 'https://edubek.app',
        'X-Title': 'EduBek',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: input.systemPrompt },
          { role: 'user', content: input.userPrompt },
        ],
        temperature,
        max_tokens: maxTokens,
      }),
    })

    if (!response.ok) {
      const errText = await response.text().catch(() => 'Unknown error')
      throw new Error(`OpenRouter API error (${response.status}): ${errText}`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content ?? ''
    const tokensIn = data.usage?.prompt_tokens ?? 0
    const tokensOut = data.usage?.completion_tokens ?? 0

    // OpenRouter cost is returned in the response (if available)
    const costUsd = data.usage?.cost ?? ((tokensIn + tokensOut) / 1_000_000) * 0.00025

    log.info('ai.generate.complete', {
      model,
      tokensIn,
      tokensOut,
      costUsd,
      latencyMs: Date.now() - start,
    })

    return {
      content,
      model: data.model || model,
      provider: this.name,
      tokensIn,
      tokensOut,
      costUsd,
      latencyMs: Date.now() - start,
      finishReason: data.choices?.[0]?.finish_reason ?? null,
    }
  }
}

// ---------------------------------------------------------------------------
// OpenAI-compatible Provider — for direct OpenAI / Azure / local endpoints
// Reads model from OPENAI_MODEL env var.
// ---------------------------------------------------------------------------

export class OpenAICompatProvider implements AIProvider {
  readonly name = 'openai-compat'

  get defaultModel(): string {
    return process.env.OPENAI_MODEL || 'gpt-4o-mini'
  }

  async generate(input: AiGenerateInput): Promise<AiGenerateResult> {
    const start = Date.now()
    const apiKey = process.env.OPENAI_API_KEY

    if (!apiKey) {
      throw new Error(
        'OPENAI_API_KEY is not set. Set it in your .env file to use OpenAI-compatible providers.'
      )
    }

    const model = input.model || this.defaultModel
    const baseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1/chat/completions'
    const temperature = input.temperature ?? 0.7
    const maxTokens = input.maxTokens ?? 4096

    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: input.systemPrompt },
          { role: 'user', content: input.userPrompt },
        ],
        temperature,
        max_tokens: maxTokens,
      }),
    })

    if (!response.ok) {
      const errText = await response.text().catch(() => 'Unknown error')
      throw new Error(`OpenAI-compatible API error (${response.status}): ${errText}`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content ?? ''
    const tokensIn = data.usage?.prompt_tokens ?? 0
    const tokensOut = data.usage?.completion_tokens ?? 0

    return {
      content,
      model: data.model || model,
      provider: this.name,
      tokensIn,
      tokensOut,
      costUsd: ((tokensIn + tokensOut) / 1_000_000) * 0.15,
      latencyMs: Date.now() - start,
      finishReason: data.choices?.[0]?.finish_reason ?? null,
    }
  }
}

// ---------------------------------------------------------------------------
// Anthropic Provider — reads model from ANTHROPIC_MODEL env var
// ---------------------------------------------------------------------------

export class AnthropicProvider implements AIProvider {
  readonly name = 'anthropic'

  get defaultModel(): string {
    return process.env.ANTHROPIC_MODEL || 'claude-3.5-sonnet'
  }

  async generate(input: AiGenerateInput): Promise<AiGenerateResult> {
    const start = Date.now()
    const apiKey = process.env.ANTHROPIC_API_KEY

    if (!apiKey) {
      throw new Error(
        'ANTHROPIC_API_KEY is not set. Set it in your .env file to use Anthropic providers.'
      )
    }

    const model = input.model || this.defaultModel
    const temperature = input.temperature ?? 0.7
    const maxTokens = input.maxTokens ?? 4096

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        system: input.systemPrompt,
        messages: [{ role: 'user', content: input.userPrompt }],
        temperature,
        max_tokens: maxTokens,
      }),
    })

    if (!response.ok) {
      const errText = await response.text().catch(() => 'Unknown error')
      throw new Error(`Anthropic API error (${response.status}): ${errText}`)
    }

    const data = await response.json()
    const content = data.content?.[0]?.text ?? ''
    const tokensIn = data.usage?.input_tokens ?? 0
    const tokensOut = data.usage?.output_tokens ?? 0

    return {
      content,
      model: data.model || model,
      provider: this.name,
      tokensIn,
      tokensOut,
      costUsd: ((tokensIn * 3) + (tokensOut * 15)) / 1_000_000,
      latencyMs: Date.now() - start,
      finishReason: data.stop_reason ?? null,
    }
  }
}

// ---------------------------------------------------------------------------
// Registry — auto-registers providers based on which env vars are set
// ---------------------------------------------------------------------------

class AiProviderRegistry {
  private providers = new Map<string, AIProvider>()
  private defaultName = ''

  register(p: AIProvider, isDefault = false) {
    this.providers.set(p.name, p)
    if (isDefault || !this.defaultName) this.defaultName = p.name
    log.info('provider registered', { name: p.name, model: p.defaultModel })
  }

  get(name?: string): AIProvider {
    const n = name ?? this.defaultName
    const p = this.providers.get(n)
    if (!p) throw new Error(`Provider "${n}" not found`)
    return p
  }

  get default(): AIProvider {
    return this.get(this.defaultName)
  }
}

export const aiProviderRegistry = new AiProviderRegistry()

// Auto-register providers based on available env vars.
// Priority: OPENROUTER > OPENAI > ANTHROPIC
// The first available provider becomes the default.
if (process.env.OPENROUTER_API_KEY) {
  aiProviderRegistry.register(new OpenRouterProvider(), true)
} else if (process.env.OPENAI_API_KEY) {
  aiProviderRegistry.register(new OpenAICompatProvider(), true)
} else if (process.env.ANTHROPIC_API_KEY) {
  aiProviderRegistry.register(new AnthropicProvider(), true)
} else {
  // No API key set — register OpenRouter as the default anyway so the error
  // message is helpful when someone tries to use AI features.
  aiProviderRegistry.register(new OpenRouterProvider(), true)
}

// ---------------------------------------------------------------------------
// Convenience exports
// ---------------------------------------------------------------------------

export function routeModel(generationType: string) {
  return {
    provider: aiProviderRegistry.default,
    model: aiProviderRegistry.default.defaultModel,
    complexity: 'complex' as const,
    reason: 'default',
  }
}

export async function generate(input: AiGenerateInput, generationType: string): Promise<AiGenerateResult & { complexity: string }> {
  const r = routeModel(generationType)
  const result = await r.provider.generate({ ...input, model: r.model })
  return { ...result, complexity: r.complexity }
}
