import { NextResponse } from 'next/server'
import { withErrorHandler } from '@/lib/errors'
import { getAuthContext } from '@/features/auth'
import { getBalance } from '@/features/wallet'
export const GET = withErrorHandler(async () => { const ctx = await getAuthContext(); return NextResponse.json(await getBalance(ctx)) })
