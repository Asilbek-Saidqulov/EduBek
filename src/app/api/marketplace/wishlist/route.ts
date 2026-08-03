import { NextResponse } from 'next/server'
import { withErrorHandler } from '@/lib/errors'
import { getAuthContext } from '@/features/auth'
import { getWishlist } from '@/features/commerce'
export const GET = withErrorHandler(async () => { const ctx = await getAuthContext(); return NextResponse.json({ items: await getWishlist(ctx) }) })
