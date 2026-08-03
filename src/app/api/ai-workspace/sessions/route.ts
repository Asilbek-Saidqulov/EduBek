import { NextResponse } from 'next/server'
import { withErrorHandler } from '@/lib/errors'
import { getAuthContext } from '@/features/auth'
import { createSession, getSessions, createSessionBodySchema } from '@/features/ai-workspace'
export const POST = withErrorHandler(async (req) => { const ctx = await getAuthContext(); const b = await req.json(); const i = createSessionBodySchema.parse(b); return NextResponse.json(await createSession(ctx, i), { status: 201 }) })
export const GET = withErrorHandler(async () => { const ctx = await getAuthContext(); return NextResponse.json({ sessions: await getSessions(ctx) }) })
