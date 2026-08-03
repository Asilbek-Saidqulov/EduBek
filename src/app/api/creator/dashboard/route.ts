import { NextResponse } from 'next/server'
import { withErrorHandler } from '@/lib/errors'
import { getAuthContext } from '@/features/auth'
import { getDashboard } from '@/features/creator-economy'
export const GET = withErrorHandler(async () => { const ctx = await getAuthContext(); return NextResponse.json(await getDashboard(ctx)) })
