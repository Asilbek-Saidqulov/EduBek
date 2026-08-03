/** GET /api/ai-workspace/history — get AI generation history. */

import { NextResponse } from 'next/server'
import { withErrorHandler } from '@/lib/errors'
import { getAuthContext } from '@/features/auth'
import { getGenerationHistory } from '@/features/ai-workspace'

export const GET = withErrorHandler(async (req) => {
  const ctx = await getAuthContext()
  const { searchParams } = new URL(req.url)
  const limit = parseInt(searchParams.get('limit') ?? '20')
  const history = await getGenerationHistory(ctx, limit)
  return NextResponse.json({ history })
})
