import { logger } from '@/lib/logger'
const log = logger.child({ module: 'ai-providers' })

export interface AiGenerateInput { systemPrompt: string; userPrompt: string; model?: string; temperature?: number; maxTokens?: number }
export interface AiGenerateResult { content: string; model: string; provider: string; tokensIn: number; tokensOut: number; costUsd: number; latencyMs: number; finishReason: string | null }
export interface AIProvider { readonly name: string; readonly defaultModel: string; generate(input: AiGenerateInput): Promise<AiGenerateResult> }

export class ZAIProvider implements AIProvider {
  readonly name = 'zai'
  readonly defaultModel = 'zai-default'
  async generate(input: AiGenerateInput): Promise<AiGenerateResult> {
    const start = Date.now()
    const ZAI = (await import('z-ai-web-dev-sdk')).default
    const zai = await ZAI.create()
    const completion = await zai.chat.completions.create({ messages: [{ role: 'system', content: input.systemPrompt }, { role: 'user', content: input.userPrompt }], thinking: { type: 'disabled' } })
    const content = completion.choices[0]?.message?.content ?? ''
    const tokensIn = completion.usage?.prompt_tokens ?? 0
    const tokensOut = completion.usage?.completion_tokens ?? 0
    return { content, model: completion.model || this.defaultModel, provider: this.name, tokensIn, tokensOut, costUsd: ((tokensIn + tokensOut) / 1000) * 0.002, latencyMs: Date.now() - start, finishReason: completion.choices[0]?.finish_reason ?? null }
  }
}

class AiProviderRegistry {
  private providers = new Map<string, AIProvider>()
  private defaultName = ''
  register(p: AIProvider, isDefault = false) { this.providers.set(p.name, p); if (isDefault || !this.defaultName) this.defaultName = p.name; log.info('provider registered', { name: p.name }) }
  get(name?: string): AIProvider { const n = name ?? this.defaultName; const p = this.providers.get(n); if (!p) throw new Error(`Provider "${n}" not found`); return p }
  get default(): AIProvider { return this.get(this.defaultName) }
}

export const aiProviderRegistry = new AiProviderRegistry()
aiProviderRegistry.register(new ZAIProvider(), true)

export function routeModel(generationType: string) { return { provider: aiProviderRegistry.default, model: aiProviderRegistry.default.defaultModel, complexity: 'complex' as const, reason: 'default' } }
export async function generate(input: AiGenerateInput, generationType: string): Promise<AiGenerateResult & { complexity: string }> { const r = routeModel(generationType); const result = await r.provider.generate({ ...input, model: r.model }); return { ...result, complexity: r.complexity } }
