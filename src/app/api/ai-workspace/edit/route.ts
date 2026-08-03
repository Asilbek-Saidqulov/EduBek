import { NextResponse } from 'next/server'
import { withErrorHandler } from '@/lib/errors'
import { getAuthContext } from '@/features/auth'
import { editResource, editBodySchema } from '@/features/ai-workspace'
export const POST = withErrorHandler(async (req) => { const ctx = await getAuthContext(); const b = await req.json(); const i = editBodySchema.parse(b); return NextResponse.json(await editResource(ctx, i)) })
