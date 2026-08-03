import { NextResponse } from 'next/server'
import { withErrorHandler } from '@/lib/errors'
import { getAuthContext } from '@/features/auth'
import { getSuggestions } from '@/features/ai-workspace'
export const GET = withErrorHandler(async (req) => { const ctx = await getAuthContext(); const { searchParams } = new URL(req.url); return NextResponse.json({ suggestions: getSuggestions(ctx, searchParams.get('resourceType'), searchParams.get('resourceId')) }) })
