/**
 * Marketplace policy — deterministic content-origin rules.
 *
 * MVP scope (Phase MVP-Marketplace-Policy):
 *   EduBek philosophy:
 *     - AI should spread knowledge → AI-generated quizzes may be published
 *       to Discover for FREE.
 *     - Creators should monetize their expertise → Marketplace is reserved
 *       for creator-authored educational work.
 *
 *   Therefore: AI Quiz Generator output MUST NOT be sold on the
 *   Marketplace. Only creator-authored educational materials may be sold
 *   (manually created quizzes, lesson plans, worksheets, presentations,
 *   teaching guides, case studies, original educational resources).
 *
 *   This is a simple deterministic validation. No manual review. No
 *   moderation workflow. No exceptions.
 *
 * Future evolution (intentionally NOT implemented today):
 *   - Granular per-resource-type rules (e.g. AI-assisted worksheets
 *     allowed if disclosed). Today the rule is global: if a resource is
 *     AI-generated it cannot be sold, period.
 *   - Disclosure / opt-in flow for "AI-assisted but human-reviewed"
 *     content. Today there is no such middle ground.
 */

import { db } from '@/lib/db'
import { logger } from '@/lib/logger'

const log = logger.child({ module: 'mp-policy' })

/**
 * Read the AI-origin flag for a Resource.
 *
 * Two sources are checked (in order):
 *   1. `Resource.metadata.isAiGenerated` (JSON column) — written by the
 *      AI Quiz Generator publishing flow.
 *   2. `Quiz.isAiGenerated` — if the resource is linked to a Quiz that
 *      was created by the AI Quiz Generator (the legacy `Quiz` table has
 *      a native `isAiGenerated` boolean column).
 *
 * Returns `true` when EITHER source is explicitly `true`. This means
 * AI-generated content cannot evade the Marketplace policy by being
 * re-published through a different surface — both code paths converge
 * on the same flag.
 */
export async function isResourceAiGenerated(resourceId: string): Promise<boolean> {
  const resource = await db.resource.findUnique({
    where: { id: resourceId },
    select: { metadata: true, content: true },
  })
  if (resource) {
    try {
      const parsed = JSON.parse(resource.metadata ?? '{}') as Record<string, unknown>
      if (parsed.isAiGenerated === true) return true
    } catch {
      log.warn('isResourceAiGenerated: malformed metadata', { resourceId })
    }
    // The Resource `content` JSON may carry a `quizId` reference. If so,
    // inspect the linked Quiz's `isAiGenerated` flag.
    try {
      const content = JSON.parse(resource.content ?? '{}') as Record<string, unknown>
      if (typeof content.quizId === 'string' && content.quizId.length > 0) {
        const quiz = await db.quiz.findUnique({
          where: { id: content.quizId },
          select: { isAiGenerated: true },
        })
        if (quiz?.isAiGenerated === true) return true
      }
    } catch {
      // Content not JSON or no quizId — ignore.
    }
  }
  return false
}

/**
 * Enforcement hook: throw `badRequest` when the caller attempts to sell
 * AI-generated content on the Marketplace.
 *
 * Callers: `createListing` and `submitListing` in `mp.service.ts`.
 *
 * The check is split into two cases so the error message is precise:
 *   - `price > 0` on an AI-generated resource → reject.
 *   - Free AI-generated resource (price === 0) is ALLOWED, but the
 *     caller is encouraged to use the Discover publishing flow instead.
 *     We do not block free listings because the policy only restricts
 *     *selling* AI content, not *listing* it for free.
 *
 * Returns `void` on success; throws `HttpError(400)` on violation.
 */
export async function enforceMarketplaceAIPolicy(input: {
  resourceId: string
  price: number
}): Promise<void> {
  const aiGenerated = await isResourceAiGenerated(input.resourceId)
  if (!aiGenerated) return
  if (input.price > 0) {
    const { badRequest } = await import('@/lib/errors')
    throw badRequest(
      'AI-generated content cannot be sold on the Marketplace. Publish it to Discover for free instead.',
      { code: 'AI_CONTENT_CANNOT_BE_SOLD' },
    )
  }
  // Free AI-generated listing — allowed but logged for visibility.
  log.info('marketplace: free AI-generated listing allowed', {
    resourceId: input.resourceId,
  })
}
