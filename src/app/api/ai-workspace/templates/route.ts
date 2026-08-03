import { NextResponse } from 'next/server'
import { withErrorHandler } from '@/lib/errors'
import { listPromptTemplates } from '@/features/ai-workspace'
export const GET = withErrorHandler(async () => NextResponse.json({ templates: listPromptTemplates() }))
